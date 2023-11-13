// noinspection JSUnusedGlobalSymbols

import { ExpressControllerConfigImp } from '@/1-Api/Express/ExpressControllerConfigImp';
import { Application } from 'express';
import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';
import { HttpController, HttpDelete, HttpGet, HttpPost, HttpPut } from '@/1-Api/AOP/Controller/ControllerDecorator';
import { MetadataControllerKey } from '@/1-Api/AOP/Controller/Enum/MetadataControllerKey';
import { ExpressControllerConfig } from '@/1-Api/Express/Interfaces/ExpressControllerConfig';

@HttpController('/unittest')
class ControllerToUnitTest {
    @HttpGet('get')
    async Get(): Promise<void> {}

    @HttpPost('post')
    async Post(): Promise<void> {}

    @HttpPut('put')
    async Put(): Promise<void> {}

    @HttpDelete('delete')
    async Delete(): Promise<void> {}

    async NonRouterMethod(): Promise<void> {}
}

class InvalidControllerUnitTest {}

function _assertToBeCalledApplicationMocks(fn: jest.Mocked<Application>, get: number, post: number, put: number, deleter: number) {
    expect(fn.get).toHaveBeenCalledTimes(get);
    expect(fn.post).toHaveBeenCalledTimes(post);
    expect(fn.put).toHaveBeenCalledTimes(put);
    expect(fn.delete).toHaveBeenCalledTimes(deleter);
}

function _assertToBeCalledServiceProviderMocks(
    fn: jest.Mocked<ServiceProvider>,
    postConfigureAction: number,
    tryAddSingletonScope: number,
    get: number,
    createScope: number,
) {
    expect(fn.PostConfigureAction).toHaveBeenCalledTimes(postConfigureAction);
    expect(fn.TryAddSingleton).toHaveBeenCalledTimes(tryAddSingletonScope);
    expect(fn.Get).toHaveBeenCalledTimes(get);
    expect(fn.CreateScope).toHaveBeenCalledTimes(createScope);
}

describe('ExpressControllerConfigImp', () => {
    let expressControllerConfig: ExpressControllerConfig;
    let appMock: jest.Mocked<Application>;
    let serviceProviderMock: jest.Mocked<ServiceProvider>;

    beforeEach(() => {
        appMock = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
        } as any;
        serviceProviderMock = {
            PostConfigureAction: jest.fn(),
            TryAddSingleton: jest.fn(),
            TryAddScoped: jest.fn(),
            Get: jest.fn(),
            CreateScope: jest.fn(),
            [Symbol.dispose]: jest.fn(),
        } as any;
        expressControllerConfig = new ExpressControllerConfigImp(appMock, serviceProviderMock);
    });

    test('Should configure routers', () => {
        // arrange
        appMock.get.mockResolvedValue(null!);
        appMock.post.mockResolvedValue(null!);
        appMock.put.mockResolvedValue(null!);
        appMock.delete.mockResolvedValue(null!);

        serviceProviderMock.PostConfigureAction.mockImplementation((action) => {
            action(serviceProviderMock);
        });

        // act
        expressControllerConfig.ConfigureRouter(ControllerToUnitTest);

        // assert
        _assertToBeCalledApplicationMocks(appMock, 1, 1, 1, 1);
        _assertToBeCalledServiceProviderMocks(serviceProviderMock, 1, 1, 0, 0);
    });

    test('Should Thrown Exception when class does not contain decorator', () => {
        // arrange

        // act
        expect(() => {
            expressControllerConfig.ConfigureRouter(InvalidControllerUnitTest);
        }).toThrow(new Error('Target must has decorator "@controller()"'));

        // assert
        _assertToBeCalledApplicationMocks(appMock, 0, 0, 0, 0);
        _assertToBeCalledServiceProviderMocks(serviceProviderMock, 0, 0, 0, 0);
    });

    test('Should execute ExpressDefaultRequest', async () => {
        // arrange
        const id = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_ID, ControllerToUnitTest);

        serviceProviderMock.CreateScope.mockImplementation(() => serviceProviderMock);

        serviceProviderMock.Get.mockImplementation(() => new ControllerToUnitTest());

        // act
        await (expressControllerConfig as ExpressControllerConfigImp)['ExpressDefaultRequest'].call(expressControllerConfig, id, 'Get')(
            {} as any,
            {} as any,
            {} as any,
        );

        // assert
        _assertToBeCalledServiceProviderMocks(serviceProviderMock, 0, 0, 1, 1);
        expect(serviceProviderMock.Get).toHaveBeenCalledWith(id);
    });

    test('Should  return responded status 500 send error ', async () => {
        // arrange
        const id = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_ID, ControllerToUnitTest);

        const statusExpected: number = 500;
        const errorExpected: Error = new Error('Fail');

        serviceProviderMock.CreateScope.mockImplementation(() => serviceProviderMock);

        serviceProviderMock.Get.mockImplementation(() => {
            throw errorExpected;
        });

        let statusReceived: number = 0;
        let errReceived: unknown;

        const restMock = {
            status: function (status: number) {
                statusReceived = status;
                return this;
            },
            send: function (result: unknown) {
                errReceived = result;
                return this;
            },
        };

        // act
        await (expressControllerConfig as ExpressControllerConfigImp)['ExpressDefaultRequest'].call(expressControllerConfig, id, 'Get')(
            {} as any,
            restMock as any,
            {} as any,
        );

        // assert
        expect(statusReceived).toStrictEqual(statusExpected);
        expect(errReceived).toStrictEqual(errorExpected);
        _assertToBeCalledServiceProviderMocks(serviceProviderMock, 0, 0, 1, 1);
        _assertToBeCalledApplicationMocks(appMock, 0, 0, 0, 0);
        expect(serviceProviderMock.Get).toHaveBeenCalledWith(id);
    });
});
