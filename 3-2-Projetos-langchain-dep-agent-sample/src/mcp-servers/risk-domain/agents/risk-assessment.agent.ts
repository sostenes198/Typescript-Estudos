/**
 * Agente especialista em avaliação de risco.
 * Analisa o card e gera um score de risco + recomendação de ação.
 */
import { tool, createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import axios from 'axios';
import { createDomainToolsMiddleware } from '../../../core/mcp/middleware';
import { withObservability } from '../../../core/observability/stream';
import type { DomainResult, JiraCardData } from '../../../core/types';

// Em produção o config viria de variáveis de ambiente do próprio servidor Risk
const RISK_SERVICE_URL = process.env.RISK_SERVICE_URL ?? 'http://risk-service';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

const riskService = axios.create({
  baseURL: RISK_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Tools ────────────────────────────────────────────────────────────────────

const fetchRiskProfileTool = tool(
  async ({ userId }: { userId: string }) => {
    const { data } = await riskService.get(`/v1/profiles/${userId}`);
    return data;
  },
  {
    name: 'fetch_risk_profile',
    description: 'Busca o perfil de risco atual de um usuário no serviço de risco',
    schema: z.object({
      userId: z.string().describe('ID do usuário a avaliar'),
    }),
  }
);

const calculateRiskScoreTool = tool(
  async ({
    userId,
    transactionHistory,
    accountAge,
  }: {
    userId: string;
    transactionHistory: number;
    accountAge: number;
  }) => {
    const { data } = await riskService.post('/v1/scores/calculate', {
      userId,
      transactionHistory,
      accountAge,
    });
    return data; // { score: number, level: 'low' | 'medium' | 'high' | 'critical' }
  },
  {
    name: 'calculate_risk_score',
    description: 'Calcula o score de risco de um usuário com base em seu histórico',
    schema: z.object({
      userId: z.string(),
      transactionHistory: z.number().describe('Número de transações nos últimos 30 dias'),
      accountAge: z.number().describe('Idade da conta em dias'),
    }),
  }
);

const flagUserForReviewTool = tool(
  async ({ userId, reason, riskLevel }: { userId: string; reason: string; riskLevel: string }) => {
    const { data } = await riskService.post('/v1/flags', { userId, reason, riskLevel });
    return data;
  },
  {
    name: 'flag_user_for_review',
    description: 'Marca um usuário para revisão manual no sistema de risco',
    schema: z.object({
      userId: z.string(),
      reason: z.string().describe('Motivo detalhado da sinalização'),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    }),
  }
);

// ─── Agente ───────────────────────────────────────────────────────────────────

const domainTools = [fetchRiskProfileTool, calculateRiskScoreTool, flagUserForReviewTool];

const riskAssessmentAgent = createAgent({
  name: 'risk_assessment_agent',
  model: new ChatAnthropic({
    model: ANTHROPIC_MODEL,
    anthropicApiKey: ANTHROPIC_API_KEY,
    temperature: 0,
  }),
  tools: [],  // middleware injeta apenas as tools deste MCP
  middleware: [createDomainToolsMiddleware(domainTools)],
  responseFormat: z.object({
    status: z.enum(['success', 'failed']),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    userId: z.string().optional(),
    score: z.number().optional(),
    flagged: z.boolean().optional(),
    errorMessage: z.string().optional(),
  }),
  systemPrompt: `Você é o agente especialista em avaliação de risco.
Ferramentas disponíveis: fetch_risk_profile, calculate_risk_score, flag_user_for_review.
Processo:
1. Extraia o userId do texto do card
2. Busque o perfil de risco atual (fetch_risk_profile)
3. Calcule o score com base no histórico (calculate_risk_score)
4. Se o nível for high ou critical, sinalize para revisão (flag_user_for_review)
5. Retorne o resultado estruturado`,
});

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runRiskAssessment(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('risk_assessment', {
    cardId: cardData.id,
    mode: 'agent',
    domain: 'RISK',
    label: 'RISK_ASSESSMENT',
  }, async () => {
    const prompt =
      `Card: ${cardData.id}\nTítulo: ${cardData.summary}\n` +
      `Descrição: ${cardData.description}\nComentários:\n${cardData.comments.join('\n')}`;

    const result = await riskAssessmentAgent.invoke({
      messages: [{ role: 'user', content: prompt }],
    });

    const sr = (result as any).structuredResponse;

    if (sr.status === 'success') {
      return {
        status: 'pending_approval',
        summary:
          `Avaliação de risco concluída para usuário \`${sr.userId}\`. ` +
          `Score: ${sr.score} | Nível: \`${sr.riskLevel}\`${sr.flagged ? ' | ⚑ Sinalizado para revisão' : ''}. ` +
          `Aguardando aprovação.`,
        operationId: crypto.randomUUID(),
        details: {
          userId: sr.userId,
          score: sr.score,
          riskLevel: sr.riskLevel,
          flagged: sr.flagged,
        },
      } satisfies DomainResult;
    }

    return {
      status: 'failed',
      summary: 'Falha na avaliação de risco',
      operationId: crypto.randomUUID(),
      error: sr.errorMessage ?? 'Erro desconhecido',
    } satisfies DomainResult;
  });
}
