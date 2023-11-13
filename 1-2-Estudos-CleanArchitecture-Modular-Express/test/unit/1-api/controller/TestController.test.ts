import { TestController } from '@/1-Api/Controller/TestController';
import { Request, Response } from 'express';

describe('TestController', () => {
    let testController: TestController;

    beforeEach(() => {
        testController = new TestController();
    });

    test('Should Get', () => {
        testController.Get(
            {} as Request,
            {
                send: () => {},
            } as Response,
        );
    });

    test('Should Post', () => {
        testController.Post(
            {} as Request,
            {
                send: () => {},
            } as Response,
        );
    });

    test('Should Put', () => {
        testController.Put(
            {} as Request,
            {
                send: () => {},
            } as Response,
        );
    });

    test('Should Delete', () => {
        testController.Delete(
            {} as Request,
            {
                send: () => {},
            } as Response,
        );
    });

    test('Should Test', () => {
        testController.Test(
            {} as Request,
            {
                send: () => {},
            } as Response,
        );
    });
});
