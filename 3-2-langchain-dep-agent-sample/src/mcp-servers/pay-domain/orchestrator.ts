import type { JiraCardData, DomainResult } from '../../core/types';
import { runFraudDetectionRule } from './agents/fraud-detection-rule.agent';
import { runCardCancel } from './agents/card-cancel.agent';
import { withObservability } from '../../core/observability/stream';

const LABEL_ROUTER: Record<string, (card: JiraCardData) => Promise<DomainResult>> = {
  PAY_FRAUD_DETECTION_RULE: runFraudDetectionRule,
  PAY_CARD_CANCEL: runCardCancel,
};

export async function runPayOrchestrator(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('pay_domain_orchestrator', {
    cardId: cardData.id,
    mode: 'domain',
    domain: 'PAY',
  }, async () => {
    const label = cardData.labels.find((l) => l in LABEL_ROUTER);

    if (!label) {
      return {
        status: 'failed',
        summary: `PAY: nenhum agente para as labels do card ${cardData.id}`,
        operationId: crypto.randomUUID(),
        error: `Labels não mapeadas: ${cardData.labels.join(', ')}`,
      };
    }

    return LABEL_ROUTER[label](cardData);
  });
}
