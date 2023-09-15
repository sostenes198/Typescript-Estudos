import express, { Application } from 'express';
import { StartUpBuilder } from './interfaces/StartUpBuilder';
import { StartUpRunner } from './interfaces/StartUpRunner';
import { ExpressControllerConfig } from '../Express/ExpressControllerConfig';
import { BootstrapperApplication } from '@/4-CrossCuting/1-IoC/BootstrapperApplication';

class StartUp implements StartUpBuilder, StartUpRunner {
    private static readonly PORT: number = 3099;
    private readonly _app: Application;

    public constructor() {
        this._app = express();
    }

    public async Build(): Promise<StartUpRunner> {
        BootstrapperApplication.InitializeApplication();
        await ExpressControllerConfig.ConfigureControllers(this._app);
        return this;
    }

    public async Run(): Promise<void> {
        this._app.listen(StartUp.PORT, (): void => {
            console.log(`Executando na porta ${StartUp.PORT}}`);
        });
    }
}

export default new StartUp();
