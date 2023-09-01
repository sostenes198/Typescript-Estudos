import express, { Request, Response } from 'express';
import Database from "./infra/db";
import NewsController from './controllers/newsController';
import * as bodyParser from 'body-parser';

class StartUp {

    public app: express.Application;
    private _db: Database;
    private bodyParser?: any;

    constructor() {
        this.app = express();
        this._db = new Database();
        this._db.createConnection();
        this.middler();
        this.routes();
    }

    middler() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }

    routes() {
        this.app.route("/").get((req: Request, res: Response) => {
            res.send({ versao: "0.0.1" });
        });

        //new
        this.app.route("/api/v1/news").get(NewsController.get);
        this.app.route("/api/v1/news/:id").get(NewsController.getById);
        this.app.route("/api/v1/news").post(NewsController.create);
        this.app.route("/api/v1/news/:id").put(NewsController.update);
        this.app.route("/api/v1/news/:id").delete(NewsController.delete);

    }
}

export default new StartUp();