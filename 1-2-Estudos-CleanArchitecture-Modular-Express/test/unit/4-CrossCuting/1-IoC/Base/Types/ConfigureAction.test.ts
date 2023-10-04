import { ConfigureAction } from '@/4-CrossCuting/1-IoC/Base/Types/ConfigureAction';
import { ServiceProvider } from '@/4-CrossCuting/1-IoC/Base/Interfaces/ServiceProvider';

describe('ConfigureAction', () => {
    test('Should validate type ConfigureAction', () => {
        // arrange - act - assert
        const action: ConfigureAction = (container: ServiceProvider): void => {
            expect(container).not.toBeNull();
            expect(container).not.toBeUndefined();
        };

        action({} as any);
    });
});
