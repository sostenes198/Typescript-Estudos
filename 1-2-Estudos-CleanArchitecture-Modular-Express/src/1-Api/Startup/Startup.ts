import express, { Application } from 'express';
import { StartUpBuilder } from './interfaces/StartUpBuilder';
import { StartUpRunner } from './interfaces/StartUpRunner';
import { ExpressRouterConfig } from '../express/ExpressRouterConfig';
import { BootstrapperApplication } from '../../4-crossCuting/1-ioc/BootstrapperApplication';
class StartUp implements StartUpBuilder, StartUpRunner {
    private static readonly PORT: number = 3099;
    private readonly _app: Application;

    public constructor() {
        this._app = express();
    }

    public async Build(): Promise<StartUpRunner> {
        BootstrapperApplication.InitializeApplication();
        await ExpressRouterConfig.ConfigureControllers(this._app);
        return this;
    }

    public async Run(): Promise<void> {
        this._app.listen(StartUp.PORT, (): void => {
            console.log(`Executando na porta ${StartUp.PORT}}`);
        });
    }
}

export default new StartUp();
