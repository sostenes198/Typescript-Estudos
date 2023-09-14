interface NovoProduto<V extends number | string> {
    nome: string;
    preco: V;
}

class Arroz implements NovoProduto<number>{
    nome: string;
    preco: number;

    constructor() {
        this.nome = "ARROZ";
        this.preco = 16.50;
    }
}

class Feijao implements NovoProduto<string>{
    nome: string;
    preco: string;

    constructor() {
        this.nome = "FEIJAO";
        this.preco = "15.99";
    }
}

function ExibirProduto<T extends NovoProduto<V>, V extends number | string>(produto: T) {
    console.log(produto.nome);
    console.log(produto.preco);
    console.log(typeof produto.preco);
}


const arroz: Arroz = new Arroz();
const feijao: Feijao = new Feijao();

ExibirProduto(arroz)
ExibirProduto(feijao)