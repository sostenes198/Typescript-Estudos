import { ServiceProvider } from '@/4-CrossCuting/1-IoC/Base/Interfaces/ServiceProvider';
import { ConfigureAction } from '@/4-CrossCuting/1-IoC/Base/Types/ConfigureAction';
import { Container, interfaces } from 'inversify';
import { ServiceIdentifier } from '@/4-CrossCuting/1-IoC/Base/Types/ServiceIdentifier';

export class AppContainerInversify implements ServiceProvider, Disposable {
    private _container: Container;
    private readonly _configureActions: Array<ConfigureAction>;

    public constructor(configureActions: Array<ConfigureAction>, container?: Container, options?: interfaces.ContainerOptions) {
        this._container = this.GetInternalContainer(container, options);
        this._configureActions = configureActions;
        this._configureActions.forEach((act) => act(this));
    }

    private GetInternalContainer(container?: Container, options?: interfaces.ContainerOptions): Container {
        container = container ?? new Container(options);
        return container;
    }

    public PostConfigureAction(action: ConfigureAction): void {
        action(this);
        this._configureActions.push(action);
    }

    public TryAddTransientScope<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        this._container.bind<T>(identifier).to(target).inRequestScope();
    }

    public TryAddSingletonScope<T>(identifier: ServiceIdentifier, target: { new (...param: any[]): T }): void {
        this._container.bind<T>(identifier).to(target).inSingletonScope();
    }

    public Get<T>(identifier: ServiceIdentifier): T {
        return this._container.get<T>(identifier);
    }

    public CreateScope(): ServiceProvider {
        const newContainer = this._container.createChild();
        return new AppContainerInversify(this._configureActions, newContainer);
    }

    [Symbol.dispose](): void {
        if (this._container) {
            this._container.unbindAll();
            this._container = null!;
        }
    }
}
