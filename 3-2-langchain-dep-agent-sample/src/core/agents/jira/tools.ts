import { tool } from 'langchain';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../../../config';
import type { JiraCardData, Board } from '../../types';

const jira = axios.create({
  baseURL: config.jira.baseUrl,
  auth: { username: config.jira.email, password: config.jira.apiToken },
  headers: { 'Content-Type': 'application/json' },
});

function boardFromKey(key: string): Board {
  const prefix = key.split('-')[0].toUpperCase();
  if (prefix === 'PAY') return 'PAY';
  if (prefix === 'MOBILITY') return 'MOBILITY';
  throw new Error(`Unknown board prefix: ${prefix}`);
}

// ─── Tool: Extract card info ──────────────────────────────────────────────────
export const extractCardTool = tool(
  async ({ cardId }: { cardId: string }): Promise<JiraCardData> => {
    const { data } = await jira.get(`/rest/api/3/issue/${cardId}`);

    const comments: string[] = (data.fields.comment?.comments ?? []).map(
      (c: any) =>
        `[${c.author.displayName}]: ${c.body?.content?.[0]?.content?.[0]?.text ?? ''}`
    );

    const attachments: string[] = (data.fields.attachment ?? []).map(
      (a: any) => a.content as string
    );

    return {
      id: data.key,
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description?.content?.[0]?.content?.[0]?.text ?? '',
      comments,
      attachments,
      status: data.fields.status.name,
      labels: data.fields.labels ?? [],
      board: boardFromKey(data.key),
      assignee: data.fields.assignee?.accountId,
      reporterAccountId: data.fields.reporter?.accountId,
    };
  },
  {
    name: 'jira_extract_card',
    description:
      'Extrai todas as informações de um card do Jira: descrição, comentários (array), anexos (links), labels e status',
    schema: z.object({
      cardId: z.string().describe('ID do card Jira (ex: PAY-2676)'),
    }),
  }
);

// ─── Tool: Comment on card ────────────────────────────────────────────────────
export const commentOnCardTool = tool(
  async ({ cardId, comment }: { cardId: string; comment: string }) => {
    await jira.post(`/rest/api/3/issue/${cardId}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: comment }] },
        ],
      },
    });
    return { success: true };
  },
  {
    name: 'jira_comment_on_card',
    description: 'Adiciona um comentário em um card do Jira',
    schema: z.object({
      cardId: z.string().describe('ID do card Jira'),
      comment: z.string().describe('Texto do comentário'),
    }),
  }
);

// ─── Tool: Move card ──────────────────────────────────────────────────────────
export const moveCardTool = tool(
  async ({ cardId, transition }: { cardId: string; transition: string }) => {
    const { data } = await jira.get(`/rest/api/3/issue/${cardId}/transitions`);
    const found = data.transitions.find((t: any) =>
      t.name.toLowerCase().includes(transition.toLowerCase())
    );
    if (!found) throw new Error(`Transition "${transition}" not found for ${cardId}`);
    await jira.post(`/rest/api/3/issue/${cardId}/transitions`, {
      transition: { id: found.id },
    });
    return { success: true, transition: found.name };
  },
  {
    name: 'jira_move_card',
    description:
      'Move um card do Jira para um status específico. Use: "Done", "Backlog" ou "Waiting Review"',
    schema: z.object({
      cardId: z.string().describe('ID do card Jira'),
      transition: z
        .string()
        .describe('Nome do status destino: "Done", "Backlog" ou "Waiting Review"'),
    }),
  }
);

// ─── Tool: Assign card ────────────────────────────────────────────────────────
export const assignCardTool = tool(
  async ({ cardId, accountId }: { cardId: string; accountId: string }) => {
    await jira.put(`/rest/api/3/issue/${cardId}/assignee`, { accountId });
    return { success: true };
  },
  {
    name: 'jira_assign_card',
    description: 'Atribui um card do Jira para um usuário pelo accountId',
    schema: z.object({
      cardId: z.string().describe('ID do card Jira'),
      accountId: z.string().describe('Account ID do usuário no Jira'),
    }),
  }
);

export const jiraTools = [extractCardTool, commentOnCardTool, moveCardTool, assignCardTool];
