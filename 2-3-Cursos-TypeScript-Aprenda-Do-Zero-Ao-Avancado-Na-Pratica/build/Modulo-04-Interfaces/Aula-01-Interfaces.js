"use strict";
const burgerK = {
    id: 1,
    nome: "",
    endereco: "",
    status: false,
    fullName: function (nome) {
        throw new Error("Function not implemented.");
    }
};
function novaLoja({ nome, endereco, status }) {
    console.log(nome, endereco, status);
}
novaLoja(burgerK);
