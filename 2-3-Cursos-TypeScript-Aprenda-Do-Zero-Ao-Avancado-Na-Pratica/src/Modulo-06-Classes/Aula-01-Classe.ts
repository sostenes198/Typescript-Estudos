
type Status = "ABERTO" | "FECHADO";

abstract class LojaBase {
    private readonly _id: number;

    protected constructor(id: number) {
        this._id = id;
    }

    get Id(): number {
        return this._id;
    }

    public abstract ExibirLoja(): string;
}

class Loja extends LojaBase {
    private readonly _nome: string;
    private _categoria: string;
    private _status: Status;

    private constructor(id: number, nome: string, categoria: string, status: Status) {
        super(id);
        this._nome = nome;
        this._categoria = categoria;
        this._status = status;
    }

    public static criarLoja(id: number, nome: string, categoria: string): Loja {
        return new Loja(id, nome, categoria, "FECHADO");
    }

    public emitirPedido(mesa: number, ...pedidos: string[]): string {
        pedidos.map((pedido) => {
            console.log(`Saindo novo pedido ${pedido}`);
        });
        return `Pedido mesa ${mesa}`;
    }

    public abrirLoja(): void {
        this._status = "ABERTO";
    }

    public fecharLoja(): void {
        this._status = "FECHADO";
    }

    public ExibirLoja(): string {
        return this._nome;
    }

    get Categoria(): string {
        return this._categoria;
    }

    set Categoria(categoria: string) {
        this._categoria = categoria;
    }
}

const loja = Loja.criarLoja(1, "Loja1", "Loja_ROUPA");

loja.Categoria = "asdasd";
console.log(loja.Categoria)

