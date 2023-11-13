export interface Configuration {
    Get(key: string): string;
    Get<T>(key: string): T;
}
