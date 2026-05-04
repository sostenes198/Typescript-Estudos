import { tool, createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import axios from 'axios';
import { createDomainToolsMiddleware } from '../../../core/mcp/middleware';
import { withObservability } from '../../../core/observability/stream';
import type { DomainResult, JiraCardData } from '../../../core/types';

const microAccount = axios.create({
  baseURL: process.env.MICRO_ACCOUNT_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const updateFraudLimitTool = tool(
  async ({ clientId, users }: { clientId: string; users: { id: string; amount: number }[] }) => {
    const { data } = await microAccount.post('/v1/fraud-limits/batch-update', { clientId, users });
    return data;
  },
  {
    name: 'update_fraud_limit',
    description: 'Atualiza o limite de fraude de múltiplos usuários de um cliente',
    schema: z.object({
      clientId: z.string(),
      users: z.array(z.object({ id: z.string(), amount: z.number() })),
    }),
  }
);

const resetFraudLimitTool = tool(
  async ({ clientId, users }: { clientId: string; users: { id: string }[] }) => {
    const { data } = await microAccount.post('/v1/fraud-limits/batch-reset', { clientId, users });
    return data;
  },
  {
    name: 'reset_fraud_limit',
    description: 'Reseta o limite de fraude ao padrão para múltiplos usuários',
    schema: z.object({
      clientId: z.string(),
      users: z.array(z.object({ id: z.string() })),
    }),
  }
);

const domainTools = [updateFraudLimitTool, resetFraudLimitTool];

const fraudAgent = createAgent({
  name: 'pay_fraud_detection_rule_agent',
  model: new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    temperature: 0,
  }),
  tools: [],
  middleware: [createDomainToolsMiddleware(domainTools)],
  responseFormat: z.object({
    status: z.enum(['success', 'failed']),
    details: z.object({
      clientId: z.string(),
      users: z.array(z.object({ id: z.string(), amount: z.number().optional() })),
    }).optional(),
    errorMessage: z.string().optional(),
  }),
  systemPrompt: `Você é o agente especialista em regras de detecção de fraude.
Ferramentas: update_fraud_limit (atualização) e reset_fraud_limit (reset ao padrão).
Extraia do texto: clientId e array de usuários com id e amount.
Decida: atualização ou reset? Invoque a tool correspondente.`,
});

export async function runFraudDetectionRule(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('pay_fraud_detection_rule', {
    cardId: cardData.id, mode: 'agent', domain: 'PAY', label: 'PAY_FRAUD_DETECTION_RULE',
  }, async () => {
    const prompt = `Card: ${cardData.id}\nTítulo: ${cardData.summary}\nDescrição: ${cardData.description}\nComentários:\n${cardData.comments.join('\n')}`;
    const result = await fraudAgent.invoke({ messages: [{ role: 'user', content: prompt }] });
    const sr = (result as any).structuredResponse;

    if (sr.status === 'success' && sr.details) {
      return {
        status: 'pending_approval',
        summary: `Limite de fraude atualizado para ${sr.details.users.length} usuário(s) do cliente \`${sr.details.clientId}\`. Aguardando aprovação.`,
        operationId: crypto.randomUUID(),
        details: sr.details,
      } satisfies DomainResult;
    }
    return {
      status: 'failed',
      summary: 'Falha ao atualizar limites de fraude',
      operationId: crypto.randomUUID(),
      error: sr.errorMessage ?? 'Erro desconhecido',
    } satisfies DomainResult;
  });
}
