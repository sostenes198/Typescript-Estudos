import { TestController } from '@/1-api/controller/TestController';
import { Request, Response } from 'express';

describe('TestController', () => {
    let testController: TestController;

    beforeEach(() => {
        testController = new TestController();
    });

    describe('Get', () => {
        test('Should Get', () => {
            testController.Get(
                {} as Request,
                {
                    send: () => {},
                } as Response,
            );
        });
    });

    describe('Post', () => {
        test('Should Post', () => {
            testController.Post(
                {} as Request,
                {
                    send: () => {},
                } as Response,
            );
        });
    });

    describe('Put', () => {
        test('Should Put', () => {
            testController.Put(
                {} as Request,
                {
                    send: () => {},
                } as Response,
            );
        });
    });

    describe('Delete', () => {
        test('Should Delete', () => {
            testController.Delete(
                {} as Request,
                {
                    send: () => {},
                } as Response,
            );
        });
    });

    describe('Test', () => {
        test('Should Test', () => {
            testController.Test(
                {} as Request,
                {
                    send: () => {},
                } as Response,
            );
        });
    });
});
