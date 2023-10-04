/*
    >> Decorators

    Class
    Propriedades
    Métodos
    Parâmetros de métodos (Pouco utilizado)
    GETTERS // SETTERS (Pouco utilizado)
*/

// target = recebe o construtor da nossa classe
function logInfo(target: any) {
  console.log(target);
}

// Padrão Factory (Fabrica) | Função que vai retornar a criação do decorator.
function logInfo2(message: string) {

  return (target: any) => {
    console.log(`${message} ${target}`);
  };
}

function setIpServidor(novoIp: string) {
  return (target: any) => {
    return class extends target {
      ip = novoIp;
    };
  };
}

function setIpServidor2(novoIp: string) {
  // return class extends constructor {
  //     ip = "http://www...";
  // };

  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    return class extends constructor {
      ip = novoIp;
    };
  };
}

function validaNome(tamanho: number) {
  return (target: any, key: string) => {
    let valor = target[key];
    const getter = () => valor;
    const setter = (value: string) => {
      if (value == "")
        console.log("Você não pode deixar em branco");
      else if (value.length > tamanho)
        console.log(`Tamanho máximo permitido ${tamanho}`);
      else
        valor = value;
    };

    Object.defineProperty(target, key, {
      get: getter,
      set: setter
    });
  };
}

function validaDescricaoJogo(tamanho: number) {
  return (target: any, key: string, descriptor: PropertyDescriptor): void => {
    // console.log(target);
    // console.log(key);
    // console.log(descriptor);

    const metodoOriginal = descriptor.value;

    console.log(`Argumentos: ${arguments}`);
    console.log(JSON.stringify(arguments));

    // Sobreescreve o método
    descriptor.value = function() {
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
@setIpServidor2("192.168.0.1")
class Sistema {
  nome: string;

  constructor(nome: string) {
    this.nome = nome;
  }
}


class Jogo {

  @validaNome(15)
  public nome: string;

  public descricao?: string;

  public constructor(nome: string) {
    this.nome = nome;
  }

  @validaDescricaoJogo(15)
  public cadastrarDescricao(descricao: string): void {
    console.log("METODO CADASTRAR DESCRICAO");
    console.log(`Descrição dentro do método: ${descricao}`);
    this.descricao = descricao;
  }
}


const jogo = new Jogo("Jogo1");

console.log(jogo.nome);
console.log(jogo.descricao);
jogo.cadastrarDescricao("OPA");
console.log(jogo.descricao);