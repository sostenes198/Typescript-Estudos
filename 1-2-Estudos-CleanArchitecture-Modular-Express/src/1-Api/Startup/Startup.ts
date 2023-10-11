import express, { Application } from 'express';
import { ExpressRouterConfigImp } from '../Express/ExpressRouterConfigImp';
import { BootstrapperApplication } from '@/4-CrossCuting/1-IoC/BootstrapperApplication';
import { ConfigureAction } from '@/2-Commons/1-Infrastructure/IoC/Types/ConfigureAction';
import { ExpressControllerConfigImp } from '../Express/ExpressControllerConfigImp';
import { ExpressRouterConfig } from '@/1-Api/Express/Interfaces/ExpressRouterConfig';
import { ServiceProvider } from '@/2-Commons/1-Infrastructure/IoC/Interfaces/ServiceProvider';
import '@/2-Commons/1-Infrastructure/Options/Extensions/ServiceProviderExtensions';

class StartUp implements StartUp {
    private static readonly PORT: number = 3099;
    private _app!: Application;
    private _expressRouterConfig!: ExpressRouterConfig;

    private constructor(app: Application, expressRouterConfig: ExpressRouterConfig) {
        this._app = app;
        this._expressRouterConfig = expressRouterConfig;
    }

    public static async Create(configurationActions?: ConfigureAction): Promise<StartUp> {
        const serviceProvider: ServiceProvider = BootstrapperApplication.InitializeApplication(configurationActions);
        const app = express();
        const expressControllerConfig = new ExpressControllerConfigImp(app, serviceProvider);
        const expressRouterConfig = new ExpressRouterConfigImp(expressControllerConfig);

        const startup = new StartUp(app, expressRouterConfig);

        return await startup.Build();
    }

    private async Build(): Promise<StartUp> {
        await this._expressRouterConfig.ConfigureControllers();
        return this;
    }

    public async Run(): Promise<void> {
        this._app.listen(StartUp.PORT, (): void => {
            console.log(`Executando na porta ${StartUp.PORT}}`);
        });
    }
}

export { StartUp };
