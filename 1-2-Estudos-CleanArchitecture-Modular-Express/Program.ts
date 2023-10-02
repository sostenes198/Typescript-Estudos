export {};
import { StartUp } from '@/1-Api/Startup/Startup';

const program = async () => {
    const startUp = await StartUp.Create();
    await startUp.Run();
};

program();
