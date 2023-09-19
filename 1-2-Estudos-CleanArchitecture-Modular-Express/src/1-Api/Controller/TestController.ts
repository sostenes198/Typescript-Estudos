import { Request, Response } from 'express';
import { HttpController, HttpDelete, HttpGet, HttpPost, HttpPut } from '../aop/controller/ControllerDecorator';
import { injectable } from 'inversify';

@injectable()
@HttpController('test')
export class TestController {
    public constructor() {}

    @HttpGet('get')
    async get(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
        res.send('ARROCHA');
    }

    @HttpPost('post')
    async post(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
    }

    @HttpPut('put')
    async put(req: Request, res: Response): Promise<void> {
        req.method;
        console.log(req);
        console.log(res);
    }

    @HttpDelete('delete')
    async delete(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
    }

    test(req: Request, res: Response): void {
        console.log(req);
        console.log(res);
    }
}
