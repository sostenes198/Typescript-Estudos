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

const cancelCardsTool = tool(
  async ({ cardsId }: { cardsId: string[] }) => {
    const { data } = await microAccount.post('/v1/cards/batch-cancel', { cardsId });
    return data;
  },
  {
    name: 'cancel_cards',
    description: 'Cancela um ou mais cartões pelo ID em lote',
    schema: z.object({ cardsId: z.array(z.string()) }),
  }
);

const cardCancelAgent = createAgent({
  name: 'pay_card_cancel_agent',
  model: new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    temperature: 0,
  }),
  tools: [],
  middleware: [createDomainToolsMiddleware([cancelCardsTool])],
  responseFormat: z.object({
    status: z.enum(['success', 'failed']),
    cancelledCards: z.array(z.string()).optional(),
    errorMessage: z.string().optional(),
  }),
  systemPrompt: `Você é o agente especialista em cancelamento de cartões.
Ferramenta disponível: cancel_cards.
Extraia os IDs dos cartões do texto e invoque cancel_cards.`,
});

export async function runCardCancel(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('pay_card_cancel', {
    cardId: cardData.id, mode: 'agent', domain: 'PAY', label: 'PAY_CARD_CANCEL',
  }, async () => {
    const prompt = `Card: ${cardData.id}\nTítulo: ${cardData.summary}\nDescrição: ${cardData.description}\nComentários:\n${cardData.comments.join('\n')}`;
    const result = await cardCancelAgent.invoke({ messages: [{ role: 'user', content: prompt }] });
    const sr = (result as any).structuredResponse;

    if (sr.status === 'success') {
      return {
        status: 'pending_approval',
        summary: `${sr.cancelledCards?.length ?? 0} cartão(ões) cancelado(s): ${sr.cancelledCards?.join(', ')}. Aguardando aprovação.`,
        operationId: crypto.randomUUID(),
        details: { cancelledCards: sr.cancelledCards },
      } satisfies DomainResult;
    }
    return {
      status: 'failed',
      summary: 'Falha ao cancelar cartões',
      operationId: crypto.randomUUID(),
      error: sr.errorMessage ?? 'Erro desconhecido',
    } satisfies DomainResult;
  });
}
