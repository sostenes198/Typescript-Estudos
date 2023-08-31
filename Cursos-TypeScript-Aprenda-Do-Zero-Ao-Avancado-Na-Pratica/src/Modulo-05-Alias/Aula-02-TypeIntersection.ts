type Info = {
    id: number;
    nome: string;
    descricao?: string;
};

type Categoria = {
    slug: string;
    quantidadeProduto: number;
};


type ProdutoInfo = Info & Categoria;

const produtoInfo: ProdutoInfo = {
    id: 1,
    nome: "Produto-01",
    quantidadeProduto: 5,
    slug: "ASDSD"
}

