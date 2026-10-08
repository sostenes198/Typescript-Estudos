import type { JiraCardData, DomainResult } from '../../core/types';
import { runRiskAssessment } from './agents/risk-assessment.agent';
import { runAccountFreeze } from './agents/account-freeze.agent';
import { withObservability } from '../../core/observability/stream';

const LABEL_ROUTER: Record<string, (card: JiraCardData) => Promise<DomainResult>> = {
  RISK_ASSESSMENT: runRiskAssessment,
  RISK_ACCOUNT_FREEZE: runAccountFreeze,
};

export async function runRiskOrchestrator(cardData: JiraCardData): Promise<DomainResult> {
  return withObservability('risk_domain_orchestrator', {
    cardId: cardData.id,
    mode: 'domain',
    domain: 'RISK',
  }, async () => {
    const label = cardData.labels.find((l) => l in LABEL_ROUTER);

    if (!label) {
      return {
        status: 'failed',
        summary: `RISK: nenhum agente para as labels do card ${cardData.id}`,
        operationId: crypto.randomUUID(),
        error: `Labels não mapeadas: ${cardData.labels.join(', ')}`,
      };
    }

    return LABEL_ROUTER[label](cardData);
  });
}
