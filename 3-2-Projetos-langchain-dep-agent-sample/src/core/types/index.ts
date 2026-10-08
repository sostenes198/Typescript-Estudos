export type Board = 'PAY' | 'MOBILITY' | 'RISK';
export type CardStatus = 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'PENDING_APPROVAL';

export interface JiraCardData {
  id: string;          // ex: "PAY-2676"
  key: string;
  summary: string;
  description: string;
  comments: string[];
  attachments: string[];
  status: string;
  labels: string[];
  board: Board;
  assignee?: string;
  reporterAccountId?: string;
}

export interface DomainResult {
  status: 'success' | 'failed' | 'pending_approval';
  summary: string;
  operationId: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface LlmUsage {
  [model: string]: { tokens: number };
}

export interface CardRecord {
  id: string;
  status: CardStatus;
  operation: string;
  link: string;
  userId: string;
  details: Record<string, unknown> | null;
  errors: string | null;
  rejectByUserReason: string | null;
  llmUsage: LlmUsage;
  notification: {
    slack?: { threadTs: string };
  };
  createdAt: Date;
  updatedAt: Date;
}
