"use strict";
/*
    >> Decorators

    Class
    Propriedades
    Métodos
    Parâmetros de métodos (Pouco utilizado)
    GETTERS // SETTERS (Pouco utilizado)
*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// target = recebe o construtor da nossa classe
function logInfo(target) {
    console.log(target);
}
// Padrão Factory (Fabrica) | Função que vai retornar a criação do decorator.
function logInfo2(message) {
    return (target) => {
        console.log(`${message} ${target}`);
    };
}
function setIpServidor(novoIp) {
    return (target) => {
        return class extends target {
            constructor() {
                super(...arguments);
                this.ip = novoIp;
            }
        };
    };
}
function setIpServidor2(novoIp) {
    // return class extends constructor {
    //     ip = "http://www...";
    // };
    return (constructor) => {
        return class extends constructor {
            constructor() {
                super(...arguments);
                this.ip = novoIp;
            }
        };
    };
}
function validaNome(tamanho) {
    return (target, key) => {
        let valor = target[key];
        const getter = () => valor;
        const setter = (value) => {
            if (value == "")
                console.log("Você não pode deixar em branco");
            else if (value.length > tamanho)
                console.log(`Tamanho máximo permitido ${tamanho}`);
            else
                valor = value;
        };
        Object.defineProperty(target, key, {
            get: getter,
            set: setter,
        });
    };
}
function validaDescricaoJogo(tamanho) {
    return (target, key, descriptor) => {
        // console.log(target);
        // console.log(key);
        // console.log(descriptor);
        const metodoOriginal = descriptor.value;
        console.log(`Argumentos: ${arguments}`);
        console.log(JSON.stringify(arguments));
        // Sobreescreve o método
        descriptor.value = function () {
            console.log("DECORATOR METODO");
            if (tamanho == 0)
                console.log("Você não pode deixar em branco");
            console.log(`Argumentos: ${arguments}`);
            console.log(JSON.stringify(arguments));
            return metodoOriginal.apply(this, arguments);
        };
    };
}
//@setIpServidor("192.168.0.1")
let Sistema = class Sistema {
    constructor(nome) {
        this.nome = nome;
    }
};
Sistema = __decorate([
    setIpServidor2("192.168.0.1")
], Sistema);
class Jogo {
    constructor(nome) {
        this.nome = nome;
    }
    cadastrarDescricao(descricao) {
        console.log("METODO CADASTRAR DESCRICAO");
        console.log(`Descrição dentro do método: ${descricao}`);
        this.descricao = descricao;
    }
}
__decorate([
    validaNome(15)
], Jogo.prototype, "nome", void 0);
__decorate([
    validaDescricaoJogo(15)
], Jogo.prototype, "cadastrarDescricao", null);
const jogo = new Jogo("Jogo1");
console.log(jogo.nome);
console.log(jogo.descricao);
jogo.cadastrarDescricao("OPA");
console.log(jogo.descricao);
