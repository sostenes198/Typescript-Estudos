// import BaseTest from '@test/integration/BaseTest';
// import { TestIntegration } from '@/4-CrossCuting/1-IoC/BootstrapperApplication';
// import { ScopeIoC } from '@/2-Commons/2-Application/IoC/Types/ScopeIoC';
//
// describe('b', () => {
//     it('test 1', () => {
//         const mock: jest.Mocked<TestIntegration> = {
//             Calc: jest.fn(),
//         };
//
//         mock.Calc.mockReturnValue(3);
//
//         BaseTest.Mock('TestIntegration', ScopeIoC.Singleton, () => {
//             return mock;
//         });
//         const x = BaseTest.ServiceProvider.Get<TestIntegration>('TestIntegration');
//
//         expect(x.Calc()).toStrictEqual(3);
//     });
//
//     it('test 2', () => {
//         const x = BaseTest.ServiceProvider.Get<TestIntegration>('TestIntegration');
//
//         expect(x.Calc()).toStrictEqual(999);
//     });
//
//     it('test 3', async () => {
//         const mock: jest.Mocked<TestIntegration> = {
//             Calc: jest.fn(),
//         };
//
//         mock.Calc.mockReturnValue(20);
//
//         BaseTest.Mock<TestIntegration>('TestIntegration', ScopeIoC.Singleton, () => {
//             return mock;
//         });
//
//         const response = await BaseTest.Client.get('/test/get-integration').set('Accept', 'application/json');
//
//         expect(response.body.calc).toStrictEqual(20);
//     });
//
//     it('test 4', async () => {
//         const response = await BaseTest.Client.get('/test/get-integration').set('Accept', 'application/json');
//
//         expect(response.body.calc).toStrictEqual(999);
//     });
// });
