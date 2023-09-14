function addNumbers (x: number, y: number): number {
    return x + y;
 }
 addNumbers(1, 2);

 let addNumbersAnonymous = function (x: number, y: number): number {
    return x + y;
 }
 addNumbersAnonymous(1, 2);

 let sum = function (input: number[]): number {
    let total: number =  0;
    for(let i = 0; i < input.length; i++) {
        if(isNaN(input[i])) {
            continue;
        }
        total += Number(input[i]);
    }
    return total;
}

console.log(sum([1, 2, 3]));

// Anonymous function
let addNumbers1 = function (x: number, y: number): number {
    return x + y;
 }
 
 // Arrow function
 let addNumbers2 = (x: number, y: number): number => x + y;

 let total2 = (input: number[]): number => {
    let total: number =  0;
    for(let i = 0; i < input.length; i++) {
        if(isNaN(input[i])) {
            continue;
        }
        total += Number(input[i]);
    }
    return total;
}

// Parâmetros opcionais
function addNumbersOptional (x: number, y?: number): number {
    if (y === undefined) {
        return x;
    } else {
        return x + y;
    }
}

addNumbersOptional(1, 2); // Returns 3
addNumbersOptional(1);    // Returns 1


// Parâmetros padrão
function addNumbersDefaultParams (x: number, y = 25): number {
    return x + y;
 }
 
 addNumbersDefaultParams(1, 2);  // Returns 3
 addNumbersDefaultParams(1);     // Returns 26

 // Parâmetros rest
 let addAllNumbers = (firstNumber: number, ...restOfNumbers: number[]): number => {
    let total: number =  firstNumber;
    for(let counter = 0; counter < restOfNumbers.length; counter++) {
       if(isNaN(restOfNumbers[counter])){
          continue;
       }
       total += Number(restOfNumbers[counter]);
    }
    return total;
 }

addAllNumbers(1, 2, 3, 4, 5, 6, 7);  // returns 28
addAllNumbers(2);                    // returns 2
// addAllNumbers(2, 3, "three");        // flags error due to data type at design time, returns 5

// Parâmetros de objeto desconstruídos
interface MessageFunc {
    text: string;
    sender: string;
 }
 
 function displayMessage({text, sender}: MessageFunc) {
     console.log(`Message from ${sender}: ${text}`);
 }
 
 displayMessage({sender: 'Christopher', text: 'hello, world'});