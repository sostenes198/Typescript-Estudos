import { z } from 'zod';

/**
 * Schema Zod do JiraCardData — usado como inputSchema da tool MCP de cada servidor.
 * Espelha exatamente o tipo JiraCardData de core/types/index.ts.
 *
 * Em produção (repos separados), este schema seria importado de um pacote
 * compartilhado: @voll/dep-agent-core-types
 */
export const jiraCardDataSchema = z.object({
  id: z.string().describe('ID do card. Ex: PAY-2676'),
  key: z.string(),
  summary: z.string().describe('Título do card'),
  description: z.string(),
  comments: z.array(z.string()),
  attachments: z.array(z.string()).describe('URLs dos anexos'),
  status: z.string(),
  labels: z.array(z.string()),
  board: z.enum(['PAY', 'MOBILITY', 'RISK']),
  assignee: z.string().optional(),
  reporterAccountId: z.string().optional(),
});

export type CardDataInput = z.infer<typeof jiraCardDataSchema>;
