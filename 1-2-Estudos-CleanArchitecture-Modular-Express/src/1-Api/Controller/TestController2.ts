import { Request, Response } from 'express';
import { HttpController, HttpDelete, HttpGet, HttpPost, HttpPut } from '../aop/controller/ControllerDecorator';
import { injectable } from 'inversify';

@injectable()
@HttpController('test2')
export class TestController {
    public constructor() {}

    @HttpGet('')
    async get(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
        res.send('ARROCHA2');
    }

    @HttpPost('')
    async post(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
    }

    @HttpPut('')
    async put(req: Request, res: Response): Promise<void> {
        req.method;
        console.log(req);
        console.log(res);
    }

    @HttpDelete('')
    async delete(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
    }

    test(req: Request, res: Response): void {
        console.log(req);
        console.log(res);
    }
}
