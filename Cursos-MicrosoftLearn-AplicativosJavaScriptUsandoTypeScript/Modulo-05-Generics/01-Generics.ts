function getArrayOld(items: any[]): any[] {
    return new Array().concat(items);
}

function getArray<T>(items: T[]): T[] {
    return new Array<T>().concat(items);
}

let numberArray = getArray([5, 10, 15, 20]);
let stringArray = getArray(['Cats', 'Dogs', 'Birds']);
numberArray.push(25);                       // OK
stringArray.push('Rabbits');                // OK
numberArray.push('This is not a number');   // OK
stringArray.push(30);                       // OK
console.log(numberArray);                   // [5, 10, 15, 20, 25, "This is not a number"]
console.log(stringArray);                   // ["Cats", "Dogs", "Birds", "Rabbits", 30]


function identity<T, U>(value: T, message: U): T {
    console.log(message);
    return value
}

let returnNumber2 = identity<number, string>(100, 'Hello!');
let returnString2 = identity<string, string>('100', 'Hola!');
let returnBoolean2 = identity<boolean, string>(true, 'Bonjour!');

returnNumber2 = returnNumber * 100;   // OK
returnString2 = returnString * 100;   // Error: Type 'number' not assignable to type 'string'
returnBoolean2 = returnBoolean * 100; // Error: Type 'number' not assignable to type 'boolean'


function identity2<T, U>(value: T, message: U): T {
    let result: T = value + value;    // Error
    console.log(message);
    return result
}

type ValidTypes = string | number;

function identity3<T extends ValidTypes, U>(value: T, message: U): T {
    let result: T = value + value;    // Error
    console.log(message);
    return result
}

let returnNumber3 = identity3<number, string>(100, 'Hello!');      // OK
let returnString3 = identity3<string, string>('100', 'Hola!');     // OK
let returnBoolean3 = identity3<boolean, string>(true, 'Bonjour!'); // Error: Type 'boolean' does not satisfy the constraint 'ValidTypes'.

function getPets<T, K extends keyof T>(pet: T, key: K) {
    return pet[key];
}

let pets1 = { cats: 4, dogs: 3, parrots: 1, fish: 6 };
let pets2 = { 1: "cats", 2: "dogs", 3: "parrots", 4: "fish" }

console.log(getPets(pets1, "fish"));  // Returns 6
console.log(getPets(pets2, "3"));     // Error


type ValidTypes2 = string | number;
function identity4<T extends ValidTypes2, U>(value: T, message: U) {   // Return type is inferred
    let result: ValidTypes = '';
    let typeValue: string = typeof value;

    if (typeof value === 'number') {           // Is it a number?
        result = value + value;                // OK
    } else if (typeof value === 'string') {    // Is it a string?
        result = value + value;                // OK
    }

    console.log(`The message is ${message} and the function returns a ${typeValue} value of ${result}`);

    return result
}

let numberValue = identity4<number, string>(100, 'Hello');
let stringValue = identity4<string, string>('100', 'Hello');

console.log(numberValue);       // Returns 200
console.log(stringValue);       // Returns 100100

/*
 Observação:
    Você só pode usar uma proteção de tipo typeof para verificar os tipos primitivos 
    string, number, bigint, function, boolean, symbol, object e indefinido. 
    Para verificar o tipo de uma classe, use uma proteção de tipo instanceof.
*/