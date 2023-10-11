import { ConfigureAction } from '@/2-Commons/1-Infrastructure/IoC/Types/ConfigureAction';
import { ServiceProvider } from '@/2-Commons/1-Infrastructure/IoC/Interfaces/ServiceProvider';

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
