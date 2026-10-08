import { Router, Request, Response } from 'express';
import { processJiraCard, resumeAfterApproval } from '../orchestrator/orchestrator';
import type { Board } from '../core/types';

export const jiraWebhookRouter = Router();

function boardFromKey(key: string): Board | null {
  const prefix = key.split('-')[0].toUpperCase();
  if (prefix === 'PAY') return 'PAY';
  if (prefix === 'MOBILITY') return 'MOBILITY';
  if (prefix === 'RISK') return 'RISK';
  return null;
}

/**
 * POST /webhooks/jira
 * Recebe eventos do Jira (issue_created / issue_updated).
 * Responde imediatamente e processa async.
 */
jiraWebhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { issue, webhookEvent } = req.body ?? {};

    if (
      webhookEvent !== 'jira:issue_created' &&
      webhookEvent !== 'jira:issue_updated'
    ) {
      return res.json({ ignored: true, reason: 'evento irrelevante' });
    }

    const cardId: string | undefined = issue?.key;
    if (!cardId) return res.status(400).json({ error: 'issue.key ausente' });

    const board = boardFromKey(cardId);
    if (!board) {
      return res.status(422).json({ error: `Board não suportado para o card: ${cardId}` });
    }

    res.json({ received: true, cardId, board });

    processJiraCard(cardId, board).catch((err) =>
      console.error(`[JiraWebhook] Erro ao processar ${cardId}:`, err)
    );
  } catch (err) {
    console.error('[JiraWebhook] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * POST /webhooks/jira/human-approval
 * Comentário no card sinaliza aprovação/rejeição (fluxo MOBILITY human-in-the-loop).
 */
jiraWebhookRouter.post('/human-approval', async (req: Request, res: Response) => {
  try {
    const { issue, comment } = req.body ?? {};
    const cardId: string | undefined = issue?.key;
    if (!cardId) return res.status(400).json({ error: 'issue.key ausente' });

    const commentText: string =
      comment?.body?.content?.[0]?.content?.[0]?.text ?? '';
    const lc = commentText.toLowerCase();
    const approved = lc.includes('aprovado') || lc.includes('ok') || lc.includes('approve');
    const reason = approved ? undefined : commentText.trim();

    res.json({ received: true, cardId, approved });

    resumeAfterApproval(cardId, { approved, reason }).catch((err) =>
      console.error(`[JiraWebhook/Approval] Erro ao retomar ${cardId}:`, err)
    );
  } catch (err) {
    console.error('[JiraWebhook/Approval] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});
