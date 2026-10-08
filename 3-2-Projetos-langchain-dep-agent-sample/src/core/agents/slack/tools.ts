import { tool } from 'langchain';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../../../config';

const slack = axios.create({
  baseURL: 'https://slack.com/api',
  headers: {
    Authorization: `Bearer ${config.slack.botToken}`,
    'Content-Type': 'application/json',
  },
});

async function slackCall(method: string, payload: object) {
  const { data } = await slack.post(`/${method}`, payload);
  if (!data.ok) throw new Error(`Slack API error [${method}]: ${data.error}`);
  return data;
}

// ─── Tool: Notify channel ─────────────────────────────────────────────────────
export const notifyChannelTool = tool(
  async ({
    message,
    channel,
    threadTs,
  }: {
    message: string;
    channel?: string;
    threadTs?: string;
  }) => {
    const result = await slackCall('chat.postMessage', {
      channel: channel ?? config.slack.notificationChannel,
      text: message,
      ...(threadTs ? { thread_ts: threadTs } : {}),
    });
    return { threadTs: result.ts as string, channel: result.channel as string };
  },
  {
    name: 'slack_notify_channel',
    description:
      'Envia notificação para um canal do Slack. Retorna thread_ts para threading futuro.',
    schema: z.object({
      message: z.string().describe('Mensagem a enviar'),
      channel: z
        .string()
        .optional()
        .describe('Canal Slack (ex: #pss). Usa o padrão se omitido.'),
      threadTs: z
        .string()
        .optional()
        .describe('Thread timestamp para responder em thread existente'),
    }),
  }
);

// ─── Tool: DM para usuário ────────────────────────────────────────────────────
export const notifyUserTool = tool(
  async ({ userId, message }: { userId: string; message: string }) => {
    const dm = await slackCall('conversations.open', { users: userId });
    const result = await slackCall('chat.postMessage', {
      channel: dm.channel.id,
      text: message,
    });
    return { threadTs: result.ts as string };
  },
  {
    name: 'slack_notify_user',
    description: 'Envia mensagem direta (DM) para um usuário no Slack',
    schema: z.object({
      userId: z.string().describe('Slack user ID do destinatário'),
      message: z.string().describe('Mensagem a enviar'),
    }),
  }
);

// ─── Tool: Solicitar aprovação com botões interativos ─────────────────────────
export const requestApprovalTool = tool(
  async ({
    userId,
    cardId,
    summary,
  }: {
    userId: string;
    cardId: string;
    summary: string;
  }) => {
    const dm = await slackCall('conversations.open', { users: userId });
    const result = await slackCall('chat.postMessage', {
      channel: dm.channel.id,
      text: `⏳ *Aprovação necessária — ${cardId}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Aprovação necessária — ${cardId}*\n\n${summary}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '✅ Aprovar' },
              style: 'primary',
              action_id: 'approve_action',
              value: `approve:${cardId}`,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '❌ Rejeitar' },
              style: 'danger',
              action_id: 'reject_action',
              value: `reject:${cardId}`,
            },
          ],
        },
      ],
    });
    return { threadTs: result.ts as string };
  },
  {
    name: 'slack_request_approval',
    description:
      'Envia DM interativa com botões Aprovar/Rejeitar para o usuário responsável',
    schema: z.object({
      userId: z.string().describe('Slack user ID do aprovador'),
      cardId: z.string().describe('ID do card Jira'),
      summary: z.string().describe('Resumo da operação que precisa de aprovação'),
    }),
  }
);

export const slackTools = [notifyChannelTool, notifyUserTool, requestApprovalTool];
