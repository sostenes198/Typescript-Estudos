"use strict";
const input1 = document.getElementById('num1');
const input2 = document.getElementById('num2');
const btnSoma = document.getElementById('buttonSomar');
const btnSubtrair = document.getElementById('buttonSubtrair');
btnSoma.addEventListener('click', function () {
    const resultado = somar(Number(input1.value), Number(input2.value));
    console.log(resultado);
});
btnSubtrair.addEventListener('click', function () {
    const resultado = subtrair(Number(input1.value), Number(input2.value));
    console.log(resultado);
});
function somar(a, b) {
    return a + b;
}
function subtrair(a, b) {
    return a - b;
}
