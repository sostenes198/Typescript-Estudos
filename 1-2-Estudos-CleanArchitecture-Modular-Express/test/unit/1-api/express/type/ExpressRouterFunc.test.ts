import { ExpressRouterFunc } from '@/1-Api/Express/Type/ExpressRouterFunc';
import { NextFunction, Request, Response } from 'express';

describe('ExpressRouteFunc', () => {
    test('Should validate type ExpressRouterFunc', () => {
        // arrange - act - assert
        const routerFunc: ExpressRouterFunc = (req: Request, res: Response, next?: NextFunction) => {
            expect(req).toBeNull();
            expect(res).toBeNull();
            expect(next).toBeNull();
        };
        expect(() => {
            routerFunc(null!, null!, null!);
        }).not.toThrow();
    });
});
