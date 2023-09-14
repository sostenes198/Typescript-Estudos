import express, { Application } from 'express';
import { StartUpBuilder } from './interfaces/StartUpBuilder';
import { StartUpRunner } from './interfaces/StartUpRunner';

class StartUp implements StartUpBuilder, StartUpRunner {
    private static readonly PORT: number = 3099;
    private readonly _app: Application;

    function(): string {
        return 'Hello World.';
    }

    public constructor() {
        this._app = express();
    }

    public Build(): StartUpRunner {
        return this;
    }

    public Run(): void {
        this._app.listen(StartUp.PORT, (): void => {
            console.log(`Executando na porta ${StartUp.PORT}}`);
        });
    }
}

export default new StartUp();
