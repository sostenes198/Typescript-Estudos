import { HttpController, HttpDelete, HttpGet, HttpPost, HttpPut } from '@/1-api/aop/controller/ControllerDecorator';
import { MetadataControllerKey } from '@/1-api/aop/controller/enum/MetadataControllerKey';
import { HttpMethod } from '@/1-api/http/enum/HttpMethod';

@HttpController('unittest')
class ControllerDecoratorTest {}

type HttpMethodScenarioType = {
    method: HttpMethod;
    fnDecorator: (urlPath: string) => (target: any, propertyKey: string) => void;
};

const httpMethodScenarios: Array<HttpMethodScenarioType> = [
    {
        method: HttpMethod.GET,
        fnDecorator: (urlPath: string) => HttpGet(urlPath),
    },
    {
        method: HttpMethod.POST,
        fnDecorator: (urlPath: string) => HttpPost(urlPath),
    },
    {
        method: HttpMethod.PUT,
        fnDecorator: (urlPath: string) => HttpPut(urlPath),
    },
    {
        method: HttpMethod.DELETE,
        fnDecorator: (urlPath: string) => HttpDelete(urlPath),
    },
];

describe('ControllerDecorator', () => {
    describe('HttpController', () => {
        test.each([
            {urlPath: 'unittest',urlPathExpected: '/unittest'},
            {urlPath: '/',urlPathExpected: '/'},
            {urlPath: '/unittest',urlPathExpected: '/unittest'},
        ])('Should create decorator $urlPathExpected', ({urlPath, urlPathExpected}) => {
            // arrange

            // act
            const funcDecorator = HttpController(urlPath);
            funcDecorator(ControllerDecoratorTest);

            // assert
            const id = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_ID, ControllerDecoratorTest);
            const controllerPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_PATH, ControllerDecoratorTest);

            expect(id).not.toBeNull();
            expect(id).not.toBeUndefined();
            expect(controllerPath).toStrictEqual(urlPathExpected);
        });

        test.failing.each([['']])('Should fail when path is invalid', (urlPath: string) => {
            // arrange - act - assert
            HttpController(urlPath);
        });
    });

    describe.each(httpMethodScenarios)('Should create HttpMethod $method', (scenario: HttpMethodScenarioType) => {
        test.each([
            { urlPath: '', urlPathExpected: '/' },
            { urlPath: '/', urlPathExpected: '/' },
            { urlPath: `${scenario.method}`, urlPathExpected: `/${scenario.method}` },
            { urlPath: `/${scenario.method}`, urlPathExpected: `/${scenario.method}` },
        ])('Should create decorator $urlPathExpected', ({ urlPath, urlPathExpected }) => {
            // arrange

            // act
            const funcDecorator = scenario.fnDecorator(urlPath);
            funcDecorator(ControllerDecoratorTest, scenario.method);

            // assert
            const controllerMethod = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD, ControllerDecoratorTest, scenario.method);
            const controllerMethodPath = Reflect.getMetadata(MetadataControllerKey.CONTROLLER_METHOD_PATH, ControllerDecoratorTest, scenario.method);

            expect(controllerMethod).toStrictEqual(scenario.method);
            expect(controllerMethodPath).toStrictEqual(urlPathExpected);
        });
    });
});
