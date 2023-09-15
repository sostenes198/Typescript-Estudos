import { ExpressRouterConfig } from './ExpressRouterConfig';
import { Application } from 'express';
import { MetadataControllerKey } from '../AOP/Controller/ControllerDecorator';
import { LoaderModule } from '../../2-Commons/1-Infrastructure/Module/LoaderModule';

export class ExpressControllerConfig {
    private constructor() {}

    public static async ConfigureControllers(app: Application) {
        const modules = await LoaderModule.ListModulesSource();

        await modules.forEach(async (module) => {
            Object.keys(module).forEach((key) => {
                if (this.IsController(module[key])) ExpressRouterConfig.ConfigureRouter(app, module[key]);
            });
        });
    }

    private static IsController<T>(target: new (...param: any[]) => T): boolean {
        const controllerPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_PATH, target);
        return controllerPath ? true : false;
    }
}
