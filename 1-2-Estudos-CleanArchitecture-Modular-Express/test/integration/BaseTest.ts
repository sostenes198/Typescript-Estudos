import supertest, { SuperTest } from 'supertest';
import { StartUpImp } from '@/1-Api/Startup/StartUpImp';
import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { ServiceIdentifier } from '@/2-Commons/2-Application/IoC/Types/ServiceIdentifier';
import { StringUtils } from '@/2-Commons/3-Domain/Utils/StringUtils';
import { ScopeIoC } from '@/2-Commons/2-Application/IoC/Types/ScopeIoC';

class BaseTest {
    private _client!: SuperTest<supertest.Test>;
    private _startUp!: StartUpImp;

    public constructor() {}

    public async Start(paramjsonFilePath?: string): Promise<void> {
        const jsonFilePath: string = StringUtils.IsNullUndefinedOrEmpty(paramjsonFilePath)
            ? `${__dirname}/configuration-integration-test.json`
            : paramjsonFilePath!;
        const startUp: StartUpImp = (await StartUpImp.Create(jsonFilePath)) as StartUpImp;

        this._client = supertest(startUp.App);
        this._startUp = startUp;
    }

    public get Client(): SuperTest<supertest.Test> {
        return this._client;
    }

    public get ServiceProvider(): ServiceProvider {
        return this._startUp.ServiceProvider;
    }

    public Mock<T>(identifier: ServiceIdentifier, scope: ScopeIoC, configurationActionsMocks: (provider: ServiceProvider) => T) {
        this._startUp.ServiceProvider.RebindDynamic<T>(identifier, scope, configurationActionsMocks);
    }

    public async Dispose(): Promise<void> {
        return await this._startUp.Dispose();
    }
}

export default new BaseTest();
