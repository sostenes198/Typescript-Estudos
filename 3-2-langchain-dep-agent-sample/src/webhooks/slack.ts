import { Router, Request, Response } from 'express';
import { resumeAfterApproval } from '../orchestrator/orchestrator';

export const slackWebhookRouter = Router();

/**
 * POST /webhooks/slack
 *
 * Recebe eventos de interação do Slack (block_actions).
 * O Slack envia o payload como application/x-www-form-urlencoded.
 * Precisa de express.urlencoded({ extended: true }) no app principal.
 *
 * Formato do value dos botões: "approve:PAY-2676" ou "reject:PAY-2676"
 */
slackWebhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Slack envia o payload serializado em JSON dentro de um campo form
    const rawPayload = req.body?.payload;
    if (!rawPayload) return res.sendStatus(200);

    const payload = JSON.parse(rawPayload);

    if (payload.type !== 'block_actions') {
      return res.sendStatus(200);
    }

    const action = payload.actions?.[0];
    const value: string = action?.value ?? '';

    // Formato: "approve:CARD-ID" ou "reject:CARD-ID"
    const separatorIdx = value.indexOf(':');
    if (separatorIdx === -1) return res.sendStatus(200);

    const decision = value.substring(0, separatorIdx);
    const cardId = value.substring(separatorIdx + 1);

    if (!cardId) return res.sendStatus(200);

    const approved = decision === 'approve';

    // ✅ Responde imediatamente ao Slack (exige resposta em < 3s)
    res.sendStatus(200);

    resumeAfterApproval(cardId, { approved }).catch((err) =>
      console.error(`[SlackWebhook] Erro ao retomar ${cardId}:`, err)
    );
  } catch (err) {
    console.error('[SlackWebhook] Erro inesperado:', err);
    // Sempre responde 200 ao Slack para evitar retry automático
    res.sendStatus(200);
  }
});
