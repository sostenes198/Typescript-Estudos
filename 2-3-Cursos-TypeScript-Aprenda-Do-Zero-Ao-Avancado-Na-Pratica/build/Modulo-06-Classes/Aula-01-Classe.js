"use strict";
class LojaBase {
    constructor(id) {
        this._id = id;
    }
    get Id() {
        return this._id;
    }
}
class Loja extends LojaBase {
    constructor(id, nome, categoria, status) {
        super(id);
        this._nome = nome;
        this._categoria = categoria;
        this._status = status;
    }
    static criarLoja(id, nome, categoria) {
        return new Loja(id, nome, categoria, "FECHADO");
    }
    emitirPedido(mesa, ...pedidos) {
        pedidos.map((pedido) => {
            console.log(`Saindo novo pedido ${pedido}`);
        });
        return `Pedido mesa ${mesa}`;
    }
    abrirLoja() {
        this._status = "ABERTO";
    }
    fecharLoja() {
        this._status = "FECHADO";
    }
    ExibirLoja() {
        return this._nome;
    }
    get Categoria() {
        return this._categoria;
    }
    set Categoria(categoria) {
        this._categoria = categoria;
    }
}
const loja = Loja.criarLoja(1, "Loja1", "Loja_ROUPA");
loja.Categoria = "asdasd";
console.log(loja.Categoria);
