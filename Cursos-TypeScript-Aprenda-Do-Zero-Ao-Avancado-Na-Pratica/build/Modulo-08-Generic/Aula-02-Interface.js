"use strict";
class Arroz {
    constructor() {
        this.nome = "ARROZ";
        this.preco = 16.50;
    }
}
class Feijao {
    constructor() {
        this.nome = "FEIJAO";
        this.preco = "15.99";
    }
}
function ExibirProduto(produto) {
    console.log(produto.nome);
    console.log(produto.preco);
    console.log(typeof produto.preco);
}
const arroz = new Arroz();
const feijao = new Feijao();
ExibirProduto(arroz);
ExibirProduto(feijao);
