import { ExpressRouterConfig } from '@/1-api/express/ExpressRouterConfig';

describe('ExpressRouteFunc', () => {
    test('Should validate type ExpressRouterFunc', () => {
        const routerFunc = ExpressRouterConfig;
        expect(routerFunc).toBeInstanceOf(ExpressRouterConfig);
    });
});
