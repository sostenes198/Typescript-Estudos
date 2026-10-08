/**
 * Observabilidade centralizada para todo o dep-agent.
 *
 * Usado por:
 *   - Orquestrador principal (graph.stream node-a-node)
 *   - Domain MCPs (wraps run() com span + NR event)
 *   - Agentes especialistas (wraps invoke() com span + NR event)
 */

import { Command } from '@langchain/langgraph';

// ─── NR stub seguro ───────────────────────────────────────────────────────────
// Em produção, substitua pelo SDK real: import newrelic from 'newrelic'
// O stub garante que a app não quebra se o agente NR não estiver configurado.
const nr = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('newrelic');
  } catch {
    return {
      recordCustomEvent: (_: string, __: object) => {},
      noticeError: (_: Error, __?: object) => {},
    };
  }
})();

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ObservabilityContext {
  cardId: string;
  mode: 'start' | 'resume' | 'domain' | 'agent';
  domain?: string;    // 'PAY' | 'MOBILITY' | nome do agente
  label?: string;     // label do card que acionou o agente
}

// ─── Log estruturado (NR Logs in Context) ─────────────────────────────────────

export function logEvent(
  level: 'info' | 'error',
  message: string,
  extra: Record<string, unknown> = {}
) {
  const entry = {
    level,
    message: `[dep-agent] ${message}`,
    service: 'dep-agent',
    env: process.env.NODE_ENV,
    ts: new Date().toISOString(),
    ...extra,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ─── Wrapper genérico para qualquer função async ──────────────────────────────
/**
 * Envolve qualquer operação assíncrona com logs + NR custom events.
 * Usado pelos domain MCPs e agentes especialistas.
 */
export async function withObservability<T>(
  operationName: string,
  ctx: ObservabilityContext,
  fn: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();

  logEvent('info', `${operationName} started`, {
    cardId: ctx.cardId,
    mode: ctx.mode,
    domain: ctx.domain,
    label: ctx.label,
    operation: operationName,
  });

  try {
    const result = await fn();
    const elapsed = Date.now() - startedAt;

    logEvent('info', `${operationName} completed`, {
      cardId: ctx.cardId,
      domain: ctx.domain,
      label: ctx.label,
      operation: operationName,
      elapsed_ms: elapsed,
    });

    nr.recordCustomEvent('DepAgentOperation', {
      operation: operationName,
      cardId: ctx.cardId,
      mode: ctx.mode,
      domain: ctx.domain ?? null,
      label: ctx.label ?? null,
      elapsed_ms: elapsed,
      success: true,
    });

    return result;
  } catch (err: any) {
    const elapsed = Date.now() - startedAt;

    logEvent('error', `${operationName} failed`, {
      cardId: ctx.cardId,
      domain: ctx.domain,
      label: ctx.label,
      operation: operationName,
      elapsed_ms: elapsed,
      error: err.message,
    });

    nr.recordCustomEvent('DepAgentOperation', {
      operation: operationName,
      cardId: ctx.cardId,
      mode: ctx.mode,
      domain: ctx.domain ?? null,
      label: ctx.label ?? null,
      elapsed_ms: elapsed,
      success: false,
      error: err.message,
    });

    nr.noticeError(err, { cardId: ctx.cardId, operation: operationName });
    throw err;
  }
}

// ─── Stream do grafo principal com observabilidade node-a-node ───────────────

export type StreamInput =
  | { mode: 'start'; cardId: string; board: 'PAY' | 'MOBILITY' }
  | { mode: 'resume'; cardId: string; decision: { approved: boolean; reason?: string } };

/**
 * Substitui graph.invoke() com streaming node-a-node.
 * Emite logs e NR custom events após cada node terminar.
 */
export async function streamGraph(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graph: any,
  input: StreamInput
): Promise<void> {
  const { cardId } = input;
  const runConfig = { configurable: { thread_id: cardId } };
  const startedAt = Date.now();

  const graphInput =
    input.mode === 'start'
      ? {
          cardId,
          board: input.board,
          cardData: null,
          dbRecord: null,
          domainResult: null,
          slackThreadTs: null,
          humanDecision: null,
          alreadyProcessed: false,
        }
      : new Command({ resume: input.decision });

  logEvent('info', 'graph execution started', { cardId, mode: input.mode });

  try {
    const stream = await graph.stream(graphInput, {
      ...runConfig,
      streamMode: 'updates',
    });

    for await (const chunk of stream) {
      const [nodeName, stateUpdate] = Object.entries(chunk)[0] as [
        string,
        Record<string, unknown>
      ];
      const elapsed = Date.now() - startedAt;

      logEvent('info', `node completed: ${nodeName}`, {
        cardId,
        mode: input.mode,
        node: nodeName,
        elapsed_ms: elapsed,
        state_summary: summarizeNodeUpdate(nodeName, stateUpdate),
      });

      nr.recordCustomEvent('DepAgentNodeCompleted', {
        cardId,
        mode: input.mode,
        node: nodeName,
        elapsed_ms: elapsed,
        domainStatus: (stateUpdate as any)?.domainResult?.status ?? null,
        alreadyProcessed: (stateUpdate as any)?.alreadyProcessed ?? null,
      });
    }

    nr.recordCustomEvent('DepAgentCardProcessed', {
      cardId,
      mode: input.mode,
      total_ms: Date.now() - startedAt,
      success: true,
    });

    logEvent('info', 'graph execution completed', {
      cardId,
      mode: input.mode,
      total_ms: Date.now() - startedAt,
    });
  } catch (err: any) {
    const elapsed = Date.now() - startedAt;

    logEvent('error', 'graph execution failed', {
      cardId,
      mode: input.mode,
      error: err.message,
      total_ms: elapsed,
    });

    nr.recordCustomEvent('DepAgentCardProcessed', {
      cardId,
      mode: input.mode,
      total_ms: elapsed,
      success: false,
      error: err.message,
    });

    nr.noticeError(err, { cardId, mode: input.mode });
    throw err;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function summarizeNodeUpdate(
  node: string,
  update: Record<string, unknown>
): Record<string, unknown> {
  switch (node) {
    case 'check_existing':
      return { alreadyProcessed: update.alreadyProcessed };
    case 'extract_card':
      return {
        board: (update.cardData as any)?.board,
        labels: (update.cardData as any)?.labels,
      };
    case 'save_executing':
      return { slackThreadTs: update.slackThreadTs };
    case 'route_to_domain':
      return {
        domainStatus: (update.domainResult as any)?.status,
        operationId: (update.domainResult as any)?.operationId,
      };
    case 'handle_pending_approval':
      return { interruptTriggered: true };
    case 'finalize_after_human':
      return { humanApproved: (update as any)?.humanDecision?.approved };
    default:
      return {};
  }
}
