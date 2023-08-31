interface LojaProps {
    readonly id: number;
    nome: string;
    endereco: string;
    status?: boolean;
    fullName(nome: string): string;
}

const burgerK: LojaProps = {
    id: 1,
    nome: "",
    endereco: "",
    status: false,
    fullName: function (nome: string): string {
        throw new Error("Function not implemented.");
    }
};

function novaLoja({ nome, endereco, status }: LojaProps) {
    console.log(nome, endereco, status);
}

novaLoja(burgerK);

interface JogaProps {
    readonly id: number;
    name: string;
    descricao: string;
    plataforma: string[];
}

interface Dlc extends JogaProps {
    jogoOriginal: JogaProps;
    novoConteudo: string[];
}