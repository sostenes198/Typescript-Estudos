import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { MongoServiceImp } from '@/2-Commons/1-Infrastructure/Repository/Mongo/MongoServiceImp';
import IocTypes from '@/2-Commons/2-Application/IoC/IoCTypes';
import { MongoClient } from 'mongodb';
import { DependencyInjectionExtensions as optDependencyInjectionExtensions } from '@/2-Commons/1-Infrastructure/Options/Extensions/DependencyInjectionExtensions';
import { MongoOptions } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Options/MongoOptions';
import { Options } from '@/2-Commons/2-Application/Options/Options';
import { MongoService } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Interfaces/MongoService';

export class DependencyInjectionExtensions {
    public static AddMongoService(service: ServiceProvider): void {
        optDependencyInjectionExtensions.AddOptions<MongoOptions>(service, IocTypes.MongoOption.Value, 'Mongo');
        service.TryAddSingletonDynamic<MongoService>(IocTypes.MongoService.Value, (provider: ServiceProvider) => {
            const mongoOptions: MongoOptions = provider.Get<Options<MongoOptions>>(IocTypes.MongoOption.Value).Value;
            const mongoClient: MongoClient = new MongoClient(mongoOptions.CreateConnection());
            return new MongoServiceImp(mongoClient, mongoOptions.DatabaseName);
        });
    }
}
