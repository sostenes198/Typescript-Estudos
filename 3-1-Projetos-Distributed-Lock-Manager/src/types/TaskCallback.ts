export type TaskCallback<T> = (
  signal: AbortSignal,
  processId: string,
) => Promise<T>;
