import express from 'express';
import { config } from './config';
import { connectMongo } from './core/db/mongo';
import { createMcpClient } from './core/mcp/client';
import { initializeDomainTools, initializeOrchestrator } from './orchestrator/orchestrator';
import { jiraWebhookRouter } from './webhooks/jira';
import { slackWebhookRouter } from './webhooks/slack';

/**
 * LangSmith — instrumentação automática.
 *
 * Basta as env vars estarem definidas antes de qualquer chamada do LangChain.
 * O SDK intercepta automaticamente:
 *   - tool.invoke()       → span por tool com input/output/latência
 *   - agent.invoke()      → span por agente com histórico de mensagens
 *   - graph.stream/invoke → trace completo do grafo node a node
 *
 * Nenhum wrapper manual necessário.
 *
 * Árvore de trace no LangSmith:
 *   Trace: PAY-2676
 *     └─ Graph: dep-agent
 *          ├─ Node: check_existing
 *          │    └─ Tool: manager_find_record       (input/output/ms)
 *          ├─ Node: extract_card
 *          │    └─ Tool: jira_extract_card
 *          ├─ Node: save_executing
 *          │    ├─ Tool: manager_create_record
 *          │    └─ Tool: slack_notify_channel
 *          └─ Node: route_to_domain
 *               └─ Tool: pay_process_card          (chamada MCP)
 *                    ├─ LLM: claude-sonnet-4-6     (tokens/latência)
 *                    └─ Tool: update_fraud_limit   (agente PAY interno)
 */
if (config.langsmith.enabled) {
  console.log(`[LangSmith] Tracing habilitado → projeto: ${config.langsmith.project}`);
} else {
  console.log('[LangSmith] Tracing desabilitado (LANGCHAIN_TRACING_V2 não definido)');
}

async function bootstrap() {
  console.log('[Bootstrap] Iniciando dep-agent...');

  // 1. MongoDB
  await connectMongo();

  // 2. Conecta aos servidores MCP e carrega as tools de domínio
  //    PAY + MOBILITY (stdio): spawna processos filhos
  //    RISK (HTTP Streamable): conecta ao servidor externo
  const { client: mcpClient, tools } = await createMcpClient();

  // 3. Mapeia tools MCP ao orquestrador (board → tool)
  initializeDomainTools(tools);

  // 4. Inicializa o grafo LangGraph com checkpointer MongoDB
  await initializeOrchestrator(config.mongodb.uri);

  // 5. Express
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_, res) =>
    res.json({
      status: 'ok',
      env: config.app.nodeEnv,
      langsmith: config.langsmith.enabled
        ? { enabled: true, project: config.langsmith.project }
        : { enabled: false },
      ts: new Date().toISOString(),
      mcps: {
        pay:      { transport: 'stdio',           tool: 'pay_process_card' },
        mobility: { transport: 'stdio',           tool: 'mobility_process_card' },
        risk:     { transport: 'http', tool: 'risk_process_card', url: config.mcps.risk.url },
      },
    })
  );

  app.use('/webhooks/jira', jiraWebhookRouter);
  app.use('/webhooks/slack', slackWebhookRouter);
  app.use((_, res) => res.status(404).json({ error: 'Not found' }));

  app.listen(config.app.port, () => {
    console.log(`[Server] Porta ${config.app.port} | Env: ${config.app.nodeEnv}`);
    console.log('[Server] MCPs conectados:');
    console.log('         [stdio]           pay_process_card');
    console.log('         [stdio]           mobility_process_card');
    console.log(`         [http]            risk_process_card → ${config.mcps.risk.url}`);
  });

  // Graceful shutdown — encerra processos filhos stdio limpos
  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} recebido — encerrando...`);
    await mcpClient.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Erro fatal:', err);
  process.exit(1);
});
