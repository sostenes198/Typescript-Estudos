import { StateGraph, END, START, interrupt, Command } from '@langchain/langgraph';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import { MongoClient } from 'mongodb';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { config } from '../config';
import { OrchestratorState, OrchestratorStateType } from './state';
import { streamGraph } from '../core/observability/stream';
import { findRecordTool, createRecordTool, updateRecordTool } from '../core/agents/manager/tools';
import { extractCardTool, commentOnCardTool, moveCardTool } from '../core/agents/jira/tools';
import { notifyChannelTool, requestApprovalTool } from '../core/agents/slack/tools';
import type { DomainResult, Board } from '../core/types';

// ─── Domain tools carregadas via MCP ─────────────────────────────────────────
// Mapeamento determinístico: Board → tool MCP
// pay_process_card      → PAY
// mobility_process_card → MOBILITY
// risk_process_card     → RISK
let domainToolsMap: Map<Board, StructuredToolInterface> = new Map();

export function initializeDomainTools(tools: StructuredToolInterface[]): void {
  domainToolsMap = new Map();
  for (const tool of tools) {
    // "pay_process_card" → "PAY" | "mobility_process_card" → "MOBILITY"
    const board = tool.name.replace('_process_card', '').toUpperCase() as Board;
    domainToolsMap.set(board, tool);
    console.log(`[Orchestrator] Tool MCP mapeada: ${tool.name} → board ${board}`);
  }
}

// ═══════════════════════════════════════════════════════════
// NODES
// ═══════════════════════════════════════════════════════════

async function checkExistingNode(state: OrchestratorStateType) {
  const record = await findRecordTool.invoke({ cardId: state.cardId });
  return { dbRecord: record ?? null, alreadyProcessed: record?.status === 'SUCCESS' };
}

async function handleAlreadyProcessedNode(state: OrchestratorStateType) {
  await commentOnCardTool.invoke({
    cardId: state.cardId,
    comment: `✅ Card já processado.\nStatus: \`${state.dbRecord?.status}\`\nOperação: \`${state.dbRecord?.operation}\``,
  });
  return {};
}

async function extractCardNode(state: OrchestratorStateType) {
  const cardData = await extractCardTool.invoke({ cardId: state.cardId });
  return { cardData, board: cardData.board };
}

async function saveExecutingNode(state: OrchestratorStateType) {
  const { cardData, cardId } = state;
  if (!cardData) throw new Error('[saveExecutingNode] cardData ausente');

  const jiraLink = `${config.jira.baseUrl}/browse/${cardId}`;
  const operation = `${cardData.board}_IA_BOT_${cardData.labels[0] ?? 'UNKNOWN'}`;

  await createRecordTool.invoke({
    id: cardId, status: 'EXECUTING', operation, link: jiraLink,
    userId: cardData.reporterAccountId ?? 'unknown',
  });

  const { threadTs } = await notifyChannelTool.invoke({
    message: `⏳ Processando *${cardId}*\nOperação: \`${operation}\`\n<${jiraLink}|Ver no Jira>`,
  });

  return { slackThreadTs: threadTs };
}

/**
 * Roteia para a tool MCP do domínio correto.
 * O orquestrador NÃO usa LLM para essa decisão — é puramente determinístico.
 * board → tool name → tool.invoke({ cardData })
 * A tool MCP encapsula toda a complexidade interna do domínio.
 */
async function routeToDomainNode(
  state: OrchestratorStateType
): Promise<{ domainResult: DomainResult }> {
  if (!state.cardData) throw new Error('[routeToDomainNode] cardData ausente');

  const tool = domainToolsMap.get(state.board);

  if (!tool) {
    return {
      domainResult: {
        status: 'failed',
        summary: `Nenhuma tool MCP para o board: ${state.board}`,
        operationId: crypto.randomUUID(),
        error: `Board não mapeado: ${state.board}. Tools disponíveis: ${[...domainToolsMap.keys()].join(', ')}`,
      },
    };
  }

  // Invoca a tool MCP — para stdio, o cliente envia via JSON-RPC ao processo filho.
  // Para HTTP Streamable, envia POST /mcp ao servidor remoto.
  // Em ambos os casos, a interface para o orquestrador é idêntica.
  const raw = await tool.invoke({ cardData: state.cardData });

  // MultiServerMCPClient retorna o content[0].text da resposta MCP
  const resultText = typeof raw === 'string' ? raw : JSON.stringify(raw);
  const domainResult: DomainResult = JSON.parse(resultText);

  return { domainResult };
}

async function handleSuccessNode(state: OrchestratorStateType) {
  const { cardId, domainResult, slackThreadTs } = state;
  if (!domainResult) throw new Error('[handleSuccessNode] domainResult ausente');
  await Promise.all([
    moveCardTool.invoke({ cardId, transition: 'Done' }),
    commentOnCardTool.invoke({ cardId, comment: `✅ *Operação concluída*\n\n${domainResult.summary}` }),
    updateRecordTool.invoke({ cardId, status: 'SUCCESS', details: domainResult.details }),
    notifyChannelTool.invoke({ message: `✅ *${cardId}* processado!\n${domainResult.summary}`, threadTs: slackThreadTs ?? undefined }),
  ]);
  return {};
}

async function handleFailedNode(state: OrchestratorStateType) {
  const { cardId, domainResult, slackThreadTs } = state;
  if (!domainResult) throw new Error('[handleFailedNode] domainResult ausente');
  await Promise.all([
    moveCardTool.invoke({ cardId, transition: 'Backlog' }),
    commentOnCardTool.invoke({ cardId, comment: `❌ *Falha*\n\n${domainResult.summary}\nErro: ${domainResult.error}` }),
    updateRecordTool.invoke({ cardId, status: 'FAILED', errors: domainResult.error }),
    notifyChannelTool.invoke({ message: `❌ *Falha* em *${cardId}*\n${domainResult.error}`, threadTs: slackThreadTs ?? undefined }),
  ]);
  return {};
}

async function handlePendingApprovalNode(state: OrchestratorStateType) {
  const { cardId, domainResult, slackThreadTs, dbRecord } = state;
  if (!domainResult) throw new Error('[handlePendingApprovalNode] domainResult ausente');

  await Promise.all([
    moveCardTool.invoke({ cardId, transition: 'Waiting Review' }),
    commentOnCardTool.invoke({ cardId, comment: `⏳ *Aguardando aprovação*\n\n${domainResult.summary}` }),
    updateRecordTool.invoke({ cardId, status: 'PENDING_APPROVAL', details: domainResult.details }),
  ]);

  const { threadTs } = await notifyChannelTool.invoke({
    message: `⏳ *${cardId}* aguarda aprovação\n${domainResult.summary}`,
    threadTs: slackThreadTs ?? undefined,
  });

  if (dbRecord?.userId && dbRecord.userId !== 'unknown') {
    await requestApprovalTool.invoke({ userId: dbRecord.userId, cardId, summary: domainResult.summary });
  }

  const humanDecision = interrupt({ reason: 'pending_approval', cardId, summary: domainResult.summary }) as { approved: boolean; reason?: string };
  return { humanDecision, slackThreadTs: threadTs };
}

async function finalizeAfterHumanNode(state: OrchestratorStateType) {
  const { cardId, humanDecision, domainResult, slackThreadTs } = state;
  if (!humanDecision || !domainResult) throw new Error('[finalizeAfterHumanNode] estado incompleto');

  if (humanDecision.approved) {
    await Promise.all([
      moveCardTool.invoke({ cardId, transition: 'Done' }),
      commentOnCardTool.invoke({ cardId, comment: `✅ *Aprovado e concluído*\n\n${domainResult.summary}` }),
      updateRecordTool.invoke({ cardId, status: 'SUCCESS', details: domainResult.details }),
      notifyChannelTool.invoke({ message: `✅ *${cardId}* aprovado!`, threadTs: slackThreadTs ?? undefined }),
    ]);
  } else {
    await Promise.all([
      moveCardTool.invoke({ cardId, transition: 'Backlog' }),
      commentOnCardTool.invoke({ cardId, comment: `❌ *Rejeitado*\nMotivo: ${humanDecision.reason ?? 'Não informado'}` }),
      updateRecordTool.invoke({ cardId, status: 'FAILED', rejectByUserReason: humanDecision.reason }),
      notifyChannelTool.invoke({ message: `❌ *${cardId}* rejeitado. Motivo: ${humanDecision.reason ?? 'N/A'}`, threadTs: slackThreadTs ?? undefined }),
    ]);
  }
  return {};
}

// ═══════════════════════════════════════════════════════════
// EDGES
// ═══════════════════════════════════════════════════════════

function routeAfterCheck(state: OrchestratorStateType) {
  return state.alreadyProcessed ? 'handle_already_processed' : 'extract_card';
}

function routeAfterDomain(state: OrchestratorStateType) {
  const { status } = state.domainResult ?? {};
  if (status === 'success') return 'handle_success';
  if (status === 'failed') return 'handle_failed';
  if (status === 'pending_approval') return 'handle_pending_approval';
  throw new Error(`Status desconhecido: ${status}`);
}

// ═══════════════════════════════════════════════════════════
// GRAPH + PUBLIC API
// ═══════════════════════════════════════════════════════════

let graph: ReturnType<typeof buildGraph> | null = null;

function buildGraph(checkpointer: MongoDBSaver) {
  return new StateGraph(OrchestratorState)
    .addNode('check_existing', checkExistingNode)
    .addNode('handle_already_processed', handleAlreadyProcessedNode)
    .addNode('extract_card', extractCardNode)
    .addNode('save_executing', saveExecutingNode)
    .addNode('route_to_domain', routeToDomainNode)
    .addNode('handle_success', handleSuccessNode)
    .addNode('handle_failed', handleFailedNode)
    .addNode('handle_pending_approval', handlePendingApprovalNode)
    .addNode('finalize_after_human', finalizeAfterHumanNode)
    .addEdge(START, 'check_existing')
    .addConditionalEdges('check_existing', routeAfterCheck, {
      handle_already_processed: 'handle_already_processed',
      extract_card: 'extract_card',
    })
    .addEdge('handle_already_processed', END)
    .addEdge('extract_card', 'save_executing')
    .addEdge('save_executing', 'route_to_domain')
    .addConditionalEdges('route_to_domain', routeAfterDomain, {
      handle_success: 'handle_success',
      handle_failed: 'handle_failed',
      handle_pending_approval: 'handle_pending_approval',
    })
    .addEdge('handle_success', END)
    .addEdge('handle_failed', END)
    .addEdge('handle_pending_approval', 'finalize_after_human')
    .addEdge('finalize_after_human', END)
    .compile({ checkpointer });
}

export async function initializeOrchestrator(mongoUri: string): Promise<void> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  graph = buildGraph(MongoDBSaver.fromClient(client));
  console.log('[Orchestrator] Grafo compilado');
}

export async function processJiraCard(cardId: string, board: Board): Promise<void> {
  if (!graph) throw new Error('Orchestrator não inicializado.');
  await streamGraph(graph, { mode: 'start', cardId, board });
}

export async function resumeAfterApproval(cardId: string, decision: { approved: boolean; reason?: string }): Promise<void> {
  if (!graph) throw new Error('Orchestrator não inicializado.');
  await streamGraph(graph, { mode: 'resume', cardId, decision });
}
