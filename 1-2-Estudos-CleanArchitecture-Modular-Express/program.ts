export {};
import StartUp from './src/1-Api/Startup/Startup';

const program = async () => {
    const build = await StartUp.Build();
    await build.Run();
};

program();
