import express, { Router, Request, Response } from 'express';
import Db from './infra/db';
import NewsControllers from './controllers/newsControllers';
import * as bodyParser from 'body-parser';

class Startup {
    public app: express.Application;

    private router: Router;
    private _db: Db;


    constructor() {
        this.app = express();
        this._db = new Db();
        this._db.createConnection();
        this.router = Router();
        this.middleware();
        this.routes();
        this.app.use(this.router);
    }

    middleware() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }

    public routes(): void {
        this.router.get('/', (req: Request, res: Response) => {
            console.log("asd");
            res.send({ versao: '0.0.1' });
        });

        this.router.get('/api/v1/news', NewsControllers.get);
        this.router.get('/api/v1/news/:id', NewsControllers.getById);
        this.router.post('/api/v1/news', NewsControllers.create);
        this.router.put('/api/v1/news/:id', NewsControllers.update);
        this.router.delete('/api/v1/news/:id', NewsControllers.delete);
    }
}
export default new Startup();