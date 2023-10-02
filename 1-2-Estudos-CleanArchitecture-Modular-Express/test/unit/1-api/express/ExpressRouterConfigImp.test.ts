import { ExpressRouterConfigImp } from '@/1-Api/Express/ExpressRouterConfigImp';
import { ExpressControllerConfig } from '@/1-Api/Express/Interfaces/ExpressControllerConfig';

describe('ExpressRouterConfigImp', () => {
    let expressRouterConfigImp: ExpressRouterConfigImp;
    let expressControllerConfigMock: jest.Mocked<ExpressControllerConfig>;

    beforeEach(() => {
        expressControllerConfigMock = {
            ConfigureRouter: jest.fn(),
        };
        expressRouterConfigImp = new ExpressRouterConfigImp(expressControllerConfigMock);
    });

    test('Should configure controller', async () => {
        // arrange

        // act
        await expressRouterConfigImp.ConfigureControllers();

        // assert
        expect(expressControllerConfigMock.ConfigureRouter.call.length).toBeGreaterThanOrEqual(1);
    });
});
