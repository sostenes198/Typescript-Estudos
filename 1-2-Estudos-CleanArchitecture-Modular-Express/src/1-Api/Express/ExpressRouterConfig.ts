import { ExpressControllerConfig } from './ExpressControllerConfig';
import { Application } from 'express';
import { MetadataControllerKey } from '../aop/controller/enum/MetadataControllerKey';
import { LoaderModule } from '@/2-commons/1-infrastructure/module/LoaderModule';

export class ExpressRouterConfig {
    private constructor() {}

    public static async ConfigureControllers(app: Application) {
        const modules = await this.ListControllersModules();
        this.ConfigureControllersModules(app, modules);
    }

    private static async ListControllersModules(): Promise<any[]> {
        return (await LoaderModule.ListModulesSource()).filter((module) => {
            Object.keys(module).forEach((key) => {
                if (this.IsController(module[key])) return module[key];
            });
        });
    }

    private static IsController<T>(target: new (...param: any[]) => T): boolean {
        const controllerPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_PATH, target);
        return !!controllerPath;
    }

    private static ConfigureControllersModules(app: Application, modules: Array<any>) {
        for (const module of modules) {
            ExpressControllerConfig.ConfigureRouter(app, module);
        }
    }
}
