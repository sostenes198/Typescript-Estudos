import express, { Express } from 'express';
import http from 'http';
import { ExpressRouterConfigImp } from '../Express/ExpressRouterConfigImp';
import { BootstrapperApplication } from '@/4-CrossCuting/1-IoC/BootstrapperApplication';
import { ConfigureAction } from '@/2-Commons/2-Application/IoC/Types/ConfigureAction';
import { ExpressControllerConfigImp } from '../Express/ExpressControllerConfigImp';
import { ExpressRouterConfig } from '@/1-Api/Express/Interfaces/ExpressRouterConfig';
import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { StartUp } from '@/1-Api/Startup/Interfaces/StartUp';
import * as console from 'console';

class StartUpImp implements StartUp {
    private static readonly PORT: number = 3099;
    private readonly _app!: Express;
    private readonly _expressRouterConfig!: ExpressRouterConfig;
    private _serviceProvider!: ServiceProvider;

    private _expressServer?: http.Server;

    private constructor(app: Express, expressRouterConfig: ExpressRouterConfig, serviceProvider: ServiceProvider) {
        this._app = app;
        this._expressRouterConfig = expressRouterConfig;
        this._serviceProvider = serviceProvider;
    }

    public static async Create(jsonFilePath: string, configurationActions?: ConfigureAction): Promise<StartUp> {
        const serviceProvider: ServiceProvider = BootstrapperApplication.InitializeApplication(jsonFilePath, configurationActions);
        const app = express();
        const expressControllerConfig = new ExpressControllerConfigImp(app, serviceProvider);
        const expressRouterConfig = new ExpressRouterConfigImp(expressControllerConfig);

        const startup = new StartUpImp(app, expressRouterConfig, serviceProvider);

        return await startup.Build();
    }

    private async Build(): Promise<StartUp> {
        await this._expressRouterConfig.ConfigureControllers();
        return this;
    }

    public get App(): Express {
        return this._app;
    }

    public get ServiceProvider(): ServiceProvider {
        return this._serviceProvider;
    }

    public async Run(): Promise<void> {
        this._expressServer = this._app.listen(StartUpImp.PORT, (): void => {
            console.log(`Executando na porta ${StartUpImp.PORT}}`);
        });
    }

    public async Dispose(): Promise<void> {
        try {
            this._expressServer?.close((err) => {
                if (err) {
                    console.error('There was an error', err.message);
                    process.exit(1);
                } else {
                    console.log('http server closed successfully. Exiting!');
                    process.exit(0);
                }
            });
        } catch (err: any) {
            console.error('There was an error', err?.message);
            setTimeout(() => process.exit(1), 500);
        }
    }
}

export { StartUpImp };
