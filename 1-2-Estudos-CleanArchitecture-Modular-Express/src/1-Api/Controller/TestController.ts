import { Request, Response } from 'express';
import { HttpController, HttpDelete, HttpGet, HttpPost, HttpPut } from '../AOP/Controller/ControllerDecorator';
import { Inject } from '@/2-Commons/1-Infrastructure/IoC/Annotations/Inject';

@Inject()
@HttpController('test')
export class TestController {
    public constructor() {}

    @HttpGet('get')
    async Get(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
        res.send('ARROCHA');
    }

    @HttpPost('post')
    async Post(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
    }

    @HttpPut('put')
    async Put(req: Request, res: Response): Promise<void> {
        req.method;
        console.log(req);
        console.log(res);
    }

    @HttpDelete('delete')
    async Delete(req: Request, res: Response): Promise<void> {
        console.log(req);
        console.log(res);
    }

    Test(req: Request, res: Response): void {
        console.log(req);
        console.log(res);
    }
}
