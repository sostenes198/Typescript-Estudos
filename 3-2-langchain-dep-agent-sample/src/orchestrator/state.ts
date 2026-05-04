import { Annotation } from '@langchain/langgraph';
import type { Board, JiraCardData, CardRecord, DomainResult } from '../core/types';

export const OrchestratorState = Annotation.Root({
  cardId: Annotation<string>(),
  board: Annotation<Board>(),

  cardData: Annotation<JiraCardData | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),

  dbRecord: Annotation<CardRecord | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),

  domainResult: Annotation<DomainResult | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),

  slackThreadTs: Annotation<string | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),

  humanDecision: Annotation<{ approved: boolean; reason?: string } | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),

  alreadyProcessed: Annotation<boolean>({
    default: () => false,
    reducer: (_, next) => next,
  }),
});

export type OrchestratorStateType = typeof OrchestratorState.State;
