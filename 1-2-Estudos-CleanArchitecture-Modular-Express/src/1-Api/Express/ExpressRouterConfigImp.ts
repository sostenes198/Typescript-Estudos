import { MetadataControllerKey } from '../AOP/Controller/Enum/MetadataControllerKey';
import { LoaderModule } from '@/2-Commons/1-Infrastructure/Module/LoaderModule';
import { ExpressRouterConfig } from './Interfaces/ExpressRouterConfig';
import { ExpressControllerConfig } from './Interfaces/ExpressControllerConfig';

export class ExpressRouterConfigImp implements ExpressRouterConfig {
    private readonly _expressControllerConfig: ExpressControllerConfig;

    public constructor(expressControllerConfig: ExpressControllerConfig) {
        this._expressControllerConfig = expressControllerConfig;
    }

    public async ConfigureControllers(): Promise<void> {
        const modules = await this.ListControllersModules();
        this.ConfigureControllersModules(modules);
    }

    private async ListControllersModules(): Promise<any[]> {
        const modules = await LoaderModule.ListModulesSource();
        return modules
            .map((module) => {
                for (const key of Object.keys(module)) {
                    if (this.IsController(module[key])) {
                        return module[key];
                    }
                }
            })
            .filter((modules) => !!modules);
    }

    private IsController<T>(target: new (...param: any[]) => T): boolean {
        const controllerPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_PATH, target);
        return !!controllerPath;
    }

    private ConfigureControllersModules(modules: Array<any>) {
        for (const module of modules) {
            this._expressControllerConfig.ConfigureRouter(module);
        }
    }
}
