import express, { Application } from 'express';
import { ExpressRouterConfigImp } from '@/1-Api/Express/ExpressRouterConfigImp';
import { BootstrapperApplication } from '@/4-CrossCuting/1-IoC/BootstrapperApplication';
import { ConfigureAction } from '@/4-CrossCuting/1-IoC/Base/Types/ConfigureAction';
import { ExpressControllerConfigImp } from '@/1-Api/Express/ExpressControllerConfigImp';

class StartUp implements StartUp {
    private static readonly PORT: number = 3099;
    private _app!: Application;
    private _expressRouterConfig!: ExpressRouterConfigImp;

    private constructor() {}

    public static async Create(configurationActions?: ConfigureAction): Promise<StartUp> {
        const serviceProvider = BootstrapperApplication.InitializeApplication(configurationActions);
        const app = express();
        const expressControllerConfig = new ExpressControllerConfigImp(app, serviceProvider);
        const expressRouterConfig = new ExpressRouterConfigImp(expressControllerConfig);

        const startup = new StartUp();
        startup._app = app;
        startup._expressRouterConfig = expressRouterConfig;

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
