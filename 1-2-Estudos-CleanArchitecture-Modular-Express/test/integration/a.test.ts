// import BaseTest from '@test/integration/BaseTest';
// import { TestIntegration } from '@/4-CrossCuting/1-IoC/BootstrapperApplication';
// // import { ScopeIoC } from '@/4-CrossCuting/1-IoC/ScopeIoC';
//
// describe('a', () => {
//     it('test 1', () => {
//         const mock: jest.Mocked<TestIntegration> = {
//             Calc: jest.fn(),
//         };
//
//         mock.Calc.mockReturnValue(1);
//
//         BaseTest.Mock('TestIntegration', ScopeIoC.Singleton, () => {
//             return mock;
//         });
//
//         const x = BaseTest.ServiceProvider.Get<TestIntegration>('TestIntegration');
//
//         expect(x.Calc()).toStrictEqual(1);
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
//         mock.Calc.mockReturnValue(10);
//
//         BaseTest.Mock<TestIntegration>('TestIntegration', ScopeIoC.Singleton, () => {
//             return mock;
//         });
//
//         const response = await BaseTest.Client.get('/test/get-integration').set('Accept', 'application/json');
//
//         expect(response.body.calc).toStrictEqual(10);
//     });
//
//     it('test 4', async () => {
//         const response = await BaseTest.Client.get('/test/get-integration').set('Accept', 'application/json');
//
//         expect(response.body.calc).toStrictEqual(999);
//     });
// });
