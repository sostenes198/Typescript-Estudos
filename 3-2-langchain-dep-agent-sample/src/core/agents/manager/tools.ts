import { tool } from 'langchain';
import { z } from 'zod';
import { CardModel } from '../../db/mongo';
import type { CardRecord, CardStatus, LlmUsage } from '../../types';

// ─── Tool: Find record ────────────────────────────────────────────────────────
export const findRecordTool = tool(
  async ({ cardId }: { cardId: string }): Promise<CardRecord | null> => {
    const doc = await CardModel.findOne({ id: cardId }).lean();
    return doc ? (doc as unknown as CardRecord) : null;
  },
  {
    name: 'manager_find_record',
    description:
      'Consulta o banco para verificar se um card já foi processado. Retorna o registro ou null.',
    schema: z.object({
      cardId: z.string().describe('ID do card Jira (ex: PAY-2676)'),
    }),
  }
);

// ─── Tool: Create record ──────────────────────────────────────────────────────
export const createRecordTool = tool(
  async ({
    id,
    status,
    operation,
    link,
    userId,
  }: {
    id: string;
    status: CardStatus;
    operation: string;
    link: string;
    userId: string;
  }): Promise<CardRecord> => {
    const doc = await CardModel.create({
      id,
      status,
      operation,
      link,
      userId,
      llmUsage: {},
      notification: {},
    });
    return doc.toObject() as unknown as CardRecord;
  },
  {
    name: 'manager_create_record',
    description: 'Cria um novo registro no banco para um card que está sendo processado',
    schema: z.object({
      id: z.string().describe('ID do card Jira'),
      status: z.enum(['EXECUTING', 'SUCCESS', 'FAILED', 'PENDING_APPROVAL']),
      operation: z
        .string()
        .describe('Nome da operação (ex: PAY_IA_BOT_FRAUD_LIMIT_UPDATE)'),
      link: z.string().describe('URL do card no Jira'),
      userId: z.string().describe('UUID do usuário responsável pelo card'),
    }),
  }
);

// ─── Tool: Update record ──────────────────────────────────────────────────────
export const updateRecordTool = tool(
  async ({
    cardId,
    status,
    details,
    errors,
    slackThreadTs,
    llmUsage,
    rejectByUserReason,
  }: {
    cardId: string;
    status?: CardStatus;
    details?: Record<string, unknown>;
    errors?: string;
    slackThreadTs?: string;
    llmUsage?: LlmUsage;
    rejectByUserReason?: string;
  }): Promise<{ updated: boolean }> => {
    const $set: Record<string, unknown> = {};

    if (status) $set['status'] = status;
    if (details !== undefined) $set['details'] = details;
    if (errors !== undefined) $set['errors'] = errors;
    if (rejectByUserReason !== undefined) $set['rejectByUserReason'] = rejectByUserReason;
    if (slackThreadTs) $set['notification.slack.threadTs'] = slackThreadTs;

    // Merge llmUsage por modelo sem sobrescrever outros
    if (llmUsage) {
      for (const [modelName, usage] of Object.entries(llmUsage)) {
        $set[`llmUsage.${modelName}.tokens`] = usage.tokens;
      }
    }

    const result = await CardModel.updateOne({ id: cardId }, { $set });
    return { updated: result.modifiedCount > 0 };
  },
  {
    name: 'manager_update_record',
    description:
      'Atualiza status, detalhes, erros ou notificação de um registro existente no banco',
    schema: z.object({
      cardId: z.string().describe('ID do card Jira'),
      status: z
        .enum(['EXECUTING', 'SUCCESS', 'FAILED', 'PENDING_APPROVAL'])
        .optional(),
      details: z.record(z.unknown()).optional().describe('Dados relevantes da operação'),
      errors: z.string().optional().describe('Mensagem de erro, se houver'),
      slackThreadTs: z
        .string()
        .optional()
        .describe('Thread TS do Slack para referência'),
      llmUsage: z
        .record(z.object({ tokens: z.number() }))
        .optional()
        .describe('Uso de tokens por modelo LLM'),
      rejectByUserReason: z
        .string()
        .optional()
        .describe('Motivo da rejeição pelo usuário'),
    }),
  }
);

export const managerTools = [findRecordTool, createRecordTool, updateRecordTool];
