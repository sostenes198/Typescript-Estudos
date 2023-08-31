"use strict";
function login(username) {
    console.log(username);
}
// Valores opcionais
function cadastro(email, senha, nome = "MANEIRO") {
    console.log(email, senha, nome);
}
cadastro("asdas", undefined);
// Valores rest
function vendar(...qtVendas) {
    console.log(qtVendas);
}
