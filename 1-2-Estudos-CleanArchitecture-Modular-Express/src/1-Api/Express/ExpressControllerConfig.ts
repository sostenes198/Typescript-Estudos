import { Application, NextFunction, Request, Response } from 'express';
import { MetadataControllerKey } from '../aop/controller/enum/MetadataControllerKey';
import { HttpMethod } from '../http/enum/HttpMethod';
import { AppContainer } from '../../4-crossCuting/1-ioc/AppContainer';
import { ExpressRouterFunc } from './type/ExpressRouterFunc';
import { Container } from 'inversify';

export class ExpressControllerConfig {
    private constructor() {}
    public static ConfigureRouter<T>(app: Application, target: new (...param: any[]) => T) {
        const [controllerId, controllerPath] = this.GetControllerMetadata(target);

        AppContainer.PostConfigure((container: Container) => container.bind<T>(controllerId).to(target).inSingletonScope());

        const prototypeProps = Object.getOwnPropertyDescriptors(target.prototype);

        for (const methodTarget in prototypeProps) {
            const [hasMethodDecorator, methodRequestPath, method] = this.GetControllerMethodMetadata(target, methodTarget);

            if (!hasMethodDecorator) continue;

            const routePath = controllerPath + methodRequestPath;

            const expressMethod = this.GetExpressMethod(app, method);
            expressMethod(routePath, this.ExpressDefaultRequest<T>(target, controllerId, methodTarget));
        }
    }

    private static GetControllerMetadata<T>(target: new (...param: any[]) => T): [controllerId: string, constrollerPath: string] {
        const controllerPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_PATH, target);
        if (!controllerPath) throw new Error('Target must has decorator "@controller()"');

        const controllerId = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_ID, target);

        return [controllerId, controllerPath];
    }

    private static GetControllerMethodMetadata<T>(target: new (...param: any[]) => T, methodTarget: string): [hasMethodDecorator: boolean, methodRequestPath: string, method: string] {
        const methodRequestPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD_PATH, target.prototype, methodTarget);
        const method = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD, target.prototype, methodTarget);

        if (!methodRequestPath || !method) return [false, '', ''];

        return [true, methodRequestPath, method];
    }

    private static GetExpressMethod(app: Application, method: string): (router: string, handler: ExpressRouterFunc) => void {
        switch (method) {
            case HttpMethod.GET:
                return (router: string, handler: ExpressRouterFunc) => app.get(router, handler);
            case HttpMethod.POST:
                return (router: string, handler: ExpressRouterFunc) => app.post(router, handler);
            case HttpMethod.PUT:
                return (router: string, handler: ExpressRouterFunc) => app.put(router, handler);
            case HttpMethod.DELETE:
                return (router: string, handler: ExpressRouterFunc) => app.delete(router, handler);
            default:
                throw new Error(`Method ${method} not found.`);
        }
    }

    private static ExpressDefaultRequest<T>(target: new (...param: any[]) => T, targetId: string, methodTarget: string): ExpressRouterFunc {
        return async function (req: Request, res: Response, next?: NextFunction) {
            using scope = AppContainer.CreateScope();
            const controller: any = scope.Container.get<T>(targetId);
            controller[methodTarget](req, res, next);
        };
    }
}
