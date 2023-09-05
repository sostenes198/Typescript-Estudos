import express, { Request, Response } from 'express';
import Database from "./infra/db";
import * as bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import Auth from './infra/auth';
import uploads from './infra/upload';
import newsRouter from './router/newsRouter';
import compression from 'compression';
import { graphqlHTTP } from 'express-graphql';
import schemas from './graphql/schemas';
import resolvers from './graphql/resolver';

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

    enableCors() {
        const options: CorsOptions = {
            methods: "GET,OPTIONS,PUT,POST,DELETE",
            origin: "*"
        };

        this.app.use(cors(options));
    }

    middler() {
        this.enableCors();
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(compression());
        this.app.use('/exports', express.static(process.cwd() + "/exports"));
    }

    routes() {
        this.app.use('/graphql', graphqlHTTP({
            schema: schemas,
            rootValue: resolvers,
            graphiql: true
        }));
    

        this.app.route("/").get((req: Request, res: Response) => {
            res.send({ versao: "0.0.1" });
        });

        this.app.route('/uploads').post(uploads.single('file'), (req: any, res: any) => {
            try {
                res.send('arquivo enviado com sucesso');
            }
            catch (error) {
                res.status(500).send({
                    error: error
                });
            }
        });

        // this.app.use(Auth.validate);

        //new
        this.app.use('/', newsRouter);

    }
}

export default new StartUp();