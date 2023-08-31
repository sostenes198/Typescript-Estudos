const input1 = document.getElementById('num1') as HTMLInputElement;
const input2 = document.getElementById('num2') as HTMLInputElement;
const btnSoma = document.getElementById('buttonSomar') as HTMLElement;
const btnSubtrair = document.getElementById('buttonSubtrair') as HTMLElement;

btnSoma.addEventListener('click', function () {
    const resultado = somar(Number(input1.value), Number(input2.value));
    console.log(resultado);
});

btnSubtrair.addEventListener('click', function () {
    const resultado = subtrair(Number(input1.value), Number(input2.value));
    console.log(resultado);
});

function somar(a: number, b: number) {
    return a + b;
}

function subtrair(a: number, b: number) {
    return a - b;
}

