import 'reflect-metadata';
import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { ConfigureAction } from '@/2-Commons/2-Application/IoC/Types/ConfigureAction';
import { Container, interfaces } from 'inversify';
import { ServiceIdentifier } from '@/2-Commons/2-Application/IoC/Types/ServiceIdentifier';
import { ScopeIoC } from '@/2-Commons/2-Application/IoC/Types/ScopeIoC';

export class AppContainerInversify implements ServiceProvider {
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

    public AddScoped<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        this._container.bind<T>(identifier).to(target).inRequestScope();
    }

    public AddScopedDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void {
        this._container
            .bind<T>(identifier)
            .toDynamicValue(() => {
                return act(this);
            })
            .inRequestScope();
    }

    public TryAddScoped<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        if (!this._container.isBound(identifier)) {
            this._container.bind<T>(identifier).to(target).inRequestScope();
        }
    }

    public TryAddScopedDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void {
        if (!this._container.isBound(identifier)) {
            this._container
                .bind<T>(identifier)
                .toDynamicValue(() => {
                    return act(this);
                })
                .inRequestScope();
        }
    }

    public AddSingleton<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        this._container.bind<T>(identifier).to(target).inSingletonScope();
    }

    public AddSingletonDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void {
        this._container
            .bind<T>(identifier)
            .toDynamicValue(() => {
                return act(this);
            })
            .inSingletonScope();
    }

    public TryAddSingleton<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        if (!this._container.isBound(identifier)) {
            this._container.bind<T>(identifier).to(target).inSingletonScope();
        }
    }

    public TryAddSingletonDynamic<T>(identifier: ServiceIdentifier, act: (provider: ServiceProvider) => T): void {
        if (!this._container.isBound(identifier)) {
            this._container
                .bind<T>(identifier)
                .toDynamicValue(() => {
                    return act(this);
                })
                .inSingletonScope();
        }
    }

    public RebindDynamic<T>(identifier: ServiceIdentifier, scope: ScopeIoC, act: (provider: ServiceProvider) => T): void {
        this._container.unbind(identifier);

        const toBind = this._container.bind<T>(identifier).toDynamicValue(() => {
            return act(this);
        });

        switch (scope) {
            case ScopeIoC.SCOPED:
                toBind.inRequestScope();
                break;
            case ScopeIoC.SINGLETON:
                toBind.inSingletonScope();
                break;
            default:
                toBind.inSingletonScope();
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
