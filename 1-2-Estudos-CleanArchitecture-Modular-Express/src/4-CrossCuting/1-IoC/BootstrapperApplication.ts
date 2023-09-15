import { AppContainer } from './AppContainer';

export class BootstrapperApplication {
    private constructor() {}

    public static InitializeApplication(): void {
        AppContainer.CreateGlobalContainer(() => {});
    }
}
