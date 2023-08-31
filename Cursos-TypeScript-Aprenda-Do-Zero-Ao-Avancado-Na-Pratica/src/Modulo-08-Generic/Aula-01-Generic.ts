function repositorio<T extends number | string>(): [() => T, (novoDado: T) => void] {
    let dados: T;

    function getDados(): T {
        return dados;
    }

    function setdados(novoDado: T): void {
        dados = novoDado;
    }

    return [getDados, setdados];
}

const repo1 = repositorio<string | number>();

repo1[1](15);

console.log(repo1[0]());