import { tool, createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import axios from 'axios';
import { createDomainToolsMiddleware } from '../../../core/mcp/middleware';
import { withObservability } from '../../../core/observability/stream';
import type { DomainResult, JiraCardData } from '../../../core/types';

const mobilityService = axios.create({
  baseURL: process.env.MOBILITY_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const extractAttachmentTool = tool(
  async ({ attachmentUrl }: { attachmentUrl: string }) => {
    const { data } = await axios.get(attachmentUrl, {
      auth: { username: process.env.JIRA_EMAIL!, password: process.env.JIRA_API_TOKEN! },
    });
    return { content: typeof data === 'string' ? data : JSON.stringify(data), url: attachmentUrl };
  },
  {
    name: 'extract_attachment',
    description: 'Faz download e extrai o conteúdo de um anexo do Jira',
    schema: z.object({ attachmentUrl: z.string() }),
  }
);

const fixAttachmentTool = tool(
  async ({ originalData, corrections }: { originalData: Record<string, unknown>; corrections: Record<string, unknown> }) => {
    return { correctedData: { ...originalData, ...corrections }, correctionCount: Object.keys(corrections).length };
  },
  {
    name: 'fix_attachment_data',
    description: 'Aplica correções nos dados do anexo',
    schema: z.object({ originalData: z.record(z.unknown()), corrections: z.record(z.unknown()) }),
  }
);

const updateMobilityDomainTool = tool(
  async ({ attachmentId, data }: { attachmentId: string; data: Record<string, unknown> }) => {
    const { data: result } = await mobilityService.patch(`/v1/attachments/${attachmentId}`, data);
    return result;
  },
  {
    name: 'update_mobility_domain',
    description: 'Atualiza o domínio Mobility com os dados corrigidos do anexo',
    schema: z.object({ attachmentId: z.string(), data: z.record(z.unknown()) }),
  }
);

const attachmentFixAgent = createAgent({
  name: 'mobility_attachment_fix_agent',
  model: new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    temperature: 0,
  }),
  tools: [],
  middleware: [createDomainToolsMiddleware([extractAttachmentTool, fixAttachmentTool, updateMobilityDomainTool])],
  responseFormat: z.object({
    status: z.enum(['success', 'failed', 'needs_human_review']),
    summary: z.string(),
    correctedData: z.record(z.unknown()).optional(),
    attachmentId: z.string().optional(),
    errorMessage: z.string().optional(),
  }),
  systemPrompt: `Você é o agente especialista em correção de anexos do domínio Mobility.
Ferramentas: extract_attachment, fix_attachment_data, update_mobility_domain.
Se a análise for complexa demais, retorne needs_human_review.`,
});

export async function runAttachmentFix(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('mobility_attachment_fix', {
    cardId: cardData.id, mode: 'agent', domain: 'MOBILITY', label: 'MOBILITY_ATTACHMENT_FIX',
  }, async () => {
    const prompt = `Card: ${cardData.id}\nTítulo: ${cardData.summary}\nDescrição: ${cardData.description}\nAnexos:\n${cardData.attachments.join('\n')}\nComentários:\n${cardData.comments.join('\n')}`;
    const result = await attachmentFixAgent.invoke({ messages: [{ role: 'user', content: prompt }] });
    const sr = (result as any).structuredResponse;

    if (sr.status === 'needs_human_review') {
      return { status: 'pending_approval', summary: `Revisão manual necessária: ${sr.summary}`, operationId: crypto.randomUUID(), details: { needsHumanReview: true, agentSummary: sr.summary } } satisfies DomainResult;
    }
    if (sr.status === 'success') {
      return { status: 'pending_approval', summary: `Anexo corrigido: ${sr.summary}. Aguardando aprovação.`, operationId: crypto.randomUUID(), details: { correctedData: sr.correctedData, attachmentId: sr.attachmentId } } satisfies DomainResult;
    }
    return { status: 'failed', summary: 'Falha na correção do anexo Mobility', operationId: crypto.randomUUID(), error: sr.errorMessage ?? 'Erro desconhecido' } satisfies DomainResult;
  });
}
