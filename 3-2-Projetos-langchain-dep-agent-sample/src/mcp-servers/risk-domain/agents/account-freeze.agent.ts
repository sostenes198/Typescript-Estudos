/**
 * Agente especialista em bloqueio de contas suspeitas.
 */
import { tool, createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import axios from 'axios';
import { createDomainToolsMiddleware } from '../../../core/mcp/middleware';
import { withObservability } from '../../../core/observability/stream';
import type { DomainResult, JiraCardData } from '../../../core/types';

const RISK_SERVICE_URL = process.env.RISK_SERVICE_URL ?? 'http://risk-service';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

const riskService = axios.create({
  baseURL: RISK_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Tools ────────────────────────────────────────────────────────────────────

const freezeAccountTool = tool(
  async ({
    userId,
    reason,
    duration,
  }: {
    userId: string;
    reason: string;
    duration: 'temporary' | 'permanent';
  }) => {
    const { data } = await riskService.post('/v1/accounts/freeze', {
      userId,
      reason,
      duration,
    });
    return data; // { frozenAt: string, expectedUnfreezeAt?: string }
  },
  {
    name: 'freeze_account',
    description: 'Bloqueia uma conta de usuário por motivo de risco',
    schema: z.object({
      userId: z.string().describe('ID da conta a bloquear'),
      reason: z.string().describe('Motivo detalhado do bloqueio'),
      duration: z.enum(['temporary', 'permanent']).describe(
        'temporary = bloqueio provisório, permanent = bloqueio definitivo'
      ),
    }),
  }
);

const notifyComplianceTool = tool(
  async ({
    userId,
    action,
    details,
  }: {
    userId: string;
    action: string;
    details: string;
  }) => {
    const { data } = await riskService.post('/v1/compliance/notify', {
      userId,
      action,
      details,
      notifiedAt: new Date().toISOString(),
    });
    return data;
  },
  {
    name: 'notify_compliance',
    description: 'Notifica o time de compliance sobre uma ação de risco executada',
    schema: z.object({
      userId: z.string(),
      action: z.string().describe('Ação executada (ex: freeze_account)'),
      details: z.string().describe('Detalhes completos para o registro de compliance'),
    }),
  }
);

// ─── Agente ───────────────────────────────────────────────────────────────────

const domainTools = [freezeAccountTool, notifyComplianceTool];

const accountFreezeAgent = createAgent({
  name: 'risk_account_freeze_agent',
  model: new ChatAnthropic({
    model: ANTHROPIC_MODEL,
    anthropicApiKey: ANTHROPIC_API_KEY,
    temperature: 0,
  }),
  tools: [],
  middleware: [createDomainToolsMiddleware(domainTools)],
  responseFormat: z.object({
    status: z.enum(['success', 'failed']),
    userId: z.string().optional(),
    frozenAt: z.string().optional(),
    duration: z.enum(['temporary', 'permanent']).optional(),
    complianceNotified: z.boolean().optional(),
    errorMessage: z.string().optional(),
  }),
  systemPrompt: `Você é o agente especialista em bloqueio de contas de risco.
Ferramentas disponíveis: freeze_account, notify_compliance.
Processo:
1. Extraia userId e motivo do texto do card
2. Determine se o bloqueio deve ser temporary ou permanent com base no contexto
3. Execute freeze_account com os dados extraídos
4. Notifique o compliance com notify_compliance
5. Retorne o resultado estruturado`,
});

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runAccountFreeze(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('risk_account_freeze', {
    cardId: cardData.id,
    mode: 'agent',
    domain: 'RISK',
    label: 'RISK_ACCOUNT_FREEZE',
  }, async () => {
    const prompt =
      `Card: ${cardData.id}\nTítulo: ${cardData.summary}\n` +
      `Descrição: ${cardData.description}\nComentários:\n${cardData.comments.join('\n')}`;

    const result = await accountFreezeAgent.invoke({
      messages: [{ role: 'user', content: prompt }],
    });

    const sr = (result as any).structuredResponse;

    if (sr.status === 'success') {
      return {
        status: 'pending_approval',
        summary:
          `Conta \`${sr.userId}\` bloqueada (${sr.duration}) em ${sr.frozenAt}. ` +
          `Compliance ${sr.complianceNotified ? 'notificado' : 'não notificado'}. ` +
          `Aguardando aprovação.`,
        operationId: crypto.randomUUID(),
        details: {
          userId: sr.userId,
          frozenAt: sr.frozenAt,
          duration: sr.duration,
          complianceNotified: sr.complianceNotified,
        },
      } satisfies DomainResult;
    }

    return {
      status: 'failed',
      summary: 'Falha ao bloquear a conta',
      operationId: crypto.randomUUID(),
      error: sr.errorMessage ?? 'Erro desconhecido',
    } satisfies DomainResult;
  });
}
