/*
Tipos de união

Um tipo de união descreve um valor que pode ser um dos vários tipos. Essa flexibilidade pode ser útil quando um valor não está sob seu controle (por exemplo, valores de uma biblioteca, uma API ou entrada de usuário).

O tipo any também pode aceitar tipos diferentes, então por que você desejaria usar um tipo de união? Os tipos de união restringem a atribuição de valores aos tipos especificados na união, enquanto o tipo any não tem restrições. Outro motivo é o suporte do IntelliSense.

Um tipo de união usa a barra vertical (|) para separar cada tipo. No seguinte exemplo, multiType pode ser um number ou um boolean:

*/
let multiType: number | boolean;
multiType = 20;         //* Valid
multiType = true;       //* Valid
// multiType = "twenty";   //* Invalid

function add(x: number | string, y: number | string) {
    if (typeof x === 'number' && typeof y === 'number') {
        return x + y;
    }
    if (typeof x === 'string' && typeof y === 'string') {
        return x.concat(y);
    }
    throw new Error('Parameters must be numbers or strings');
}

/*
Tipos de interseção

Os tipos de interseção estão fortemente relacionados a tipos de união, mas eles são usados de maneira diferente. Um tipo de interseção combina dois ou mais tipos para criar um tipo que tenha todas as propriedades dos tipos existentes. Uma interseção permite que você adicione tipos existentes para obter um tipo que tenha todos os recursos necessários.

Um tipo de interseção usa o e comercial (&) para separar cada tipo.
*/

console.log(add('one', 'two'));  //* Returns "onetwo"
console.log(add(1, 2));          //* Returns 3
console.log(add('one', 2));      //* Returns error

interface Employee {
    employeeID: number;
    age: number;
  }
  interface Manager {
    stockPlan: boolean;
  }
  type ManagementEmployee = Employee & Manager;
  let newManager: ManagementEmployee = {
      employeeID: 12345,
      age: 34,
      stockPlan: true
  };

  /*
Definindo tipos literais
Os tipos literais são escritos como literais de tipo de objeto, matriz, função ou construtor e são usados para compor novos tipos com base em outros tipos.
  */

type testResult = "pass" | "fail" | "incomplete";
let myResult: testResult;
myResult = "incomplete";    //* Valid
myResult = "pass";          //* Valid
// myResult = "failure";       //* Invalid

type dice = 1 | 2 | 3 | 4 | 5 | 6;
let diceRoll: dice;
diceRoll = 1;    //* Valid
diceRoll = 2;    //* Valid
// diceRoll = 7;    //* Invalid