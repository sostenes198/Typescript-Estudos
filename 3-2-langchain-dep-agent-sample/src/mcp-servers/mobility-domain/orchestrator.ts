import type { JiraCardData, DomainResult } from '../../core/types';
import { runAttachmentFix } from './agents/attachment-fix.agent';
import { withObservability } from '../../core/observability/stream';

const LABEL_ROUTER: Record<string, (card: JiraCardData) => Promise<DomainResult>> = {
  MOBILITY_ATTACHMENT_FIX: runAttachmentFix,
};

export async function runMobilityOrchestrator(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('mobility_domain_orchestrator', {
    cardId: cardData.id,
    mode: 'domain',
    domain: 'MOBILITY',
  }, async () => {
    const label = cardData.labels.find((l) => l in LABEL_ROUTER);

    if (!label) {
      return {
        status: 'failed',
        summary: `MOBILITY: nenhum agente para as labels do card ${cardData.id}`,
        operationId: crypto.randomUUID(),
        error: `Labels não mapeadas: ${cardData.labels.join(', ')}`,
      };
    }

    return LABEL_ROUTER[label](cardData);
  });
}
