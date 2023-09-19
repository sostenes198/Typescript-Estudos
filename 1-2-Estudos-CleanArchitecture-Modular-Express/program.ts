export {};
import StartUp from './src/1-api/startup/Startup';

const program = async () => {
    const build = await StartUp.Build();
    await build.Run();
};

program();
