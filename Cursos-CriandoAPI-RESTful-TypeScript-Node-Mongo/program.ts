import Startup from "./startup";

let port: number = Number(process.env.PORT) || 3099;

Startup.app.listen(port, (): void => {
    console.log(`Executando na porta ${port}`);
});