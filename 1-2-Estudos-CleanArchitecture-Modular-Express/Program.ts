export {};
import { StartUpImp } from '@/1-Api/Startup/StartUpImp';

const configJsonFile: string = process.cwd().concat('/').concat('config.json');

const program = async () => {
    const startUp = await StartUpImp.Create(configJsonFile);
    await startUp.Run();
    process.on('SIGINT', async () => {
        await startUp.Dispose();
    });
    process.on('SIGTERM', async () => {
        await startUp.Dispose();
    });
};

program();
