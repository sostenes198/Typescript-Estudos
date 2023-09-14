type Uuid = number | string | null;

function acessar(uuid: Uuid, nome: string) {
    console.log(`ID: ${uuid} - Bem vindo ${nome}`);
}

function logUsuario(uuid: Uuid) {
    console.log(`Conta referente ao UUID ${uuid}`);
}