"use strict";
function repositorio() {
    let dados;
    function getDados() {
        return dados;
    }
    function setdados(novoDado) {
        dados = novoDado;
    }
    return [getDados, setdados];
}
const repo1 = repositorio();
repo1[1](15);
console.log(repo1[0]());
