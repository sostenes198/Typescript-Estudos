export interface ExpressControllerConfig {
    ConfigureRouter<T>(target: new (...param: any[]) => T): void;
}