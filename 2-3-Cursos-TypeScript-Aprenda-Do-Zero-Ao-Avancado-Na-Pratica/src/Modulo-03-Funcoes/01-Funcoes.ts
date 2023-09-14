function login(username: string): void {
    console.log(username);
}

// Valores opcionais
function cadastro(email: string, senha?: string, nome: string = "MANEIRO") {
    console.log(email, senha, nome);
}

cadastro("asdas", undefined);

// Valores rest

function vendar(...qtVendas: number[]) {
    console.log(qtVendas);
}