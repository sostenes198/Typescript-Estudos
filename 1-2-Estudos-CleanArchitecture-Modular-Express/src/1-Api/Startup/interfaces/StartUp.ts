export interface StartUp {
    Run(): Promise<void>;
    Dispose(): Promise<void>;
}
