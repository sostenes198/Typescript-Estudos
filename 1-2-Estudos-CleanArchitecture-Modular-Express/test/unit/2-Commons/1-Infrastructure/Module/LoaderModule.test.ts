import { LoaderModule } from '@/2-Commons/1-Infrastructure/Module/LoaderModule';

describe('LoaderModule', () => {
    test('Should import modules', async () => {
        const modules = await LoaderModule.ListModulesSource();
        expect(modules.length).toBeGreaterThan(0);
    });
});
