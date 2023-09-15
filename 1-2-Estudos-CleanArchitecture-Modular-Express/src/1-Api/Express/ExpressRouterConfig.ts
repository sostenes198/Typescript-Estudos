import { Application, NextFunction, Request, Response } from 'express';
import { MetadataControllerKey } from '../AOP/Controller/ControllerDecorator';
import { HttpMethod } from '../Http/Enum/HttpMethod';
import { AppContainer } from '../../4-CrossCuting/1-IoC/AppContainer';
import { ExpressRouteFunc } from '../Express/type/ExpressRouteFunc';
import { Container } from 'inversify';

export class ExpressRouterConfig {
    private constructor() {}
    public static ConfigureRouter<T>(app: Application, target: new (...param: any[]) => T) {
        const controllerPath = this.GetControllerMetadata(target);

        AppContainer.PostConfigure((container: Container) => container.bind<T>(target.name).to(target).inSingletonScope());

        const prototypeProps = Object.getOwnPropertyDescriptors(target.prototype);

        for (const methodTarget in prototypeProps) {
            const [hasMethodDecorator, methodRequestPath, method] = this.GetControllerMethodMetadata(target, methodTarget);

            if (!hasMethodDecorator) continue;

            const routePath = controllerPath + methodRequestPath;

            const expressMethod = this.GetExpressMethod(app, method);
            expressMethod(routePath, this.ExpressDefaultRequest<T>(target, methodTarget));
        }
    }

    private static GetControllerMetadata<T>(target: new (...param: any[]) => T): string {
        const controllerPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_PATH, target);
        if (!controllerPath) throw new Error('Target must has decorator "@controller()"');

        return controllerPath;
    }

    private static GetControllerMethodMetadata<T>(target: new (...param: any[]) => T, methodTarget: string): [hasMethodDecorator: boolean, methodRequestPath: string, method: string] {
        const methodRequestPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD_PATH, target.prototype, methodTarget);
        const method = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD, target.prototype, methodTarget);

        if (!methodRequestPath || !method) return [false, '', ''];

        return [true, methodRequestPath, method];
    }

    private static GetExpressMethod(app: Application, method: string): (router: string, handler: ExpressRouteFunc) => void {
        switch (method) {
            case HttpMethod.GET:
                return (router: string, handler: ExpressRouteFunc) => app.get(router, handler);
            case HttpMethod.POST:
                return (router: string, handler: ExpressRouteFunc) => app.post(router, handler);
            case HttpMethod.PUT:
                return (router: string, handler: ExpressRouteFunc) => app.put(router, handler);
            case HttpMethod.DELETE:
                return (router: string, handler: ExpressRouteFunc) => app.delete(router, handler);
            default:
                throw new Error(`Method ${method} not found.`);
        }
    }

    private static ExpressDefaultRequest<T>(target: new (...param: any[]) => T, methodTarget: string): ExpressRouteFunc {
        return async function (req: Request, res: Response, next?: NextFunction) {
            using scope = AppContainer.CreateScope();
            const controller: any = scope.Container.get<T>(target.name);
            controller[methodTarget](req, res, next);
        };
    }
}
