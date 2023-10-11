import 'reflect-metadata';
import { ServiceProvider } from '@/2-Commons/1-Infrastructure/IoC/Interfaces/ServiceProvider';
import { ConfigureAction } from '@/2-Commons/1-Infrastructure/IoC/Types/ConfigureAction';
import { Container, interfaces } from 'inversify';
import { ServiceIdentifier } from '@/2-Commons/1-Infrastructure/IoC/Types/ServiceIdentifier';

export class AppContainerInversify implements ServiceProvider, Disposable {
    private _container: Container;
    private readonly _configureActions: Array<ConfigureAction>;

    public constructor(configureActions: Array<ConfigureAction>, container?: Container, options?: interfaces.ContainerOptions) {
        this._container = container ?? new Container(options);
        this._configureActions = configureActions;
        this._configureActions.forEach((act) => act(this));
    }

    public PostConfigureAction(action: ConfigureAction): void {
        action(this);
        this._configureActions.push(action);
    }

    public AddTransient<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        this._container.bind<T>(identifier).to(target).inRequestScope();
    }

    public TryAddTransient<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        if (!this._container.isBound(identifier)) {
            this._container.bind<T>(identifier).to(target).inRequestScope();
        }
    }

    public AddSingleton<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        this._container.bind<T>(identifier).to(target).inSingletonScope();
    }

    public TryAddSingleton<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        if (!this._container.isBound(identifier)) {
            this._container.bind<T>(identifier).to(target).inSingletonScope();
        }
    }

    public Get<T>(identifier: ServiceIdentifier): T {
        return this._container.get<T>(identifier);
    }

    public List<T>(identifier: ServiceIdentifier): Array<T> {
        return this._container.getAll<T>(identifier);
    }

    public CreateScope(): ServiceProvider {
        const newContainer = this._container.createChild();
        return new AppContainerInversify(this._configureActions, newContainer);
    }

    [Symbol.dispose]() {
        if (this._container) {
            this._container.unbindAll();
            this._container = null!;
        }
    }
}
