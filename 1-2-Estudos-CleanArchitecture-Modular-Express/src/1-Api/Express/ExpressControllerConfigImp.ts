import { Application, NextFunction, Request, Response } from 'express';
import { MetadataControllerKey } from '../AOP/Controller/Enum/MetadataControllerKey';
import { ExpressRouterFunc } from './Type/ExpressRouterFunc';
import { HttpMethod } from '../Http/Enum/HttpMethod';
import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { ExpressControllerConfig } from './Interfaces/ExpressControllerConfig';

export class ExpressControllerConfigImp implements ExpressControllerConfig {
    private readonly _app: Application;
    private readonly _serviceProvider: ServiceProvider;

    public constructor(app: Application, serviceProvider: ServiceProvider) {
        this._app = app;
        this._serviceProvider = serviceProvider;
    }

    public ConfigureRouter<T>(target: new (...param: any[]) => T): void {
        const [controllerId, controllerPath] = this.GetControllerMetadata(target);

        this._serviceProvider.PostConfigureAction((serviceProvider) => {
            serviceProvider.TryAddSingleton<T>(controllerId, target);
        });

        const prototypeProps = Object.getOwnPropertyDescriptors(target.prototype);

        for (const methodTarget in prototypeProps) {
            const [hasMethodDecorator, methodRequestPath, method] = this.GetControllerMethodMetadata(target, methodTarget);

            if (!hasMethodDecorator) continue;

            const routePath = controllerPath + methodRequestPath;

            const expressMethod = this.GetExpressMethod(method);
            expressMethod(routePath, this.ExpressDefaultRequest<T>(controllerId, methodTarget));
        }
    }

    private GetControllerMetadata<T>(target: new (...param: any[]) => T): [controllerId: string, constrollerPath: string] {
        const controllerPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_PATH, target);
        if (!controllerPath) throw new Error('Target must has decorator "@controller()"');

        const controllerId = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_ID, target);

        return [controllerId, controllerPath];
    }

    private GetControllerMethodMetadata<T>(
        target: new (...param: any[]) => T,
        methodTarget: string,
    ): [hasMethodDecorator: boolean, methodRequestPath: string, method: string] {
        const methodRequestPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD_PATH, target.prototype, methodTarget);
        const method = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD, target.prototype, methodTarget);

        if (!methodRequestPath || !method) return [false, '', ''];

        return [true, methodRequestPath, method];
    }

    private GetExpressMethod(method: string): (router: string, handler: ExpressRouterFunc) => void {
        switch (method) {
            case HttpMethod.GET:
                return (router: string, handler: ExpressRouterFunc) => this._app.get(router, handler);
            case HttpMethod.POST:
                return (router: string, handler: ExpressRouterFunc) => this._app.post(router, handler);
            case HttpMethod.PUT:
                return (router: string, handler: ExpressRouterFunc) => this._app.put(router, handler);
            default:
                return (router: string, handler: ExpressRouterFunc) => this._app.delete(router, handler);
        }
    }

    private ExpressDefaultRequest<T>(targetId: string, methodTarget: string): ExpressRouterFunc {
        return async (req: Request, res: Response, next?: NextFunction) => {
            const scope = this._serviceProvider.CreateScope();
            try {
                const controller: any = scope.Get<T>(targetId);
                controller[methodTarget](req, res, next);
            } catch (err) {
                res.status(500).send(err);
            } finally {
                scope[Symbol.dispose]();
            }
        };
    }
}
