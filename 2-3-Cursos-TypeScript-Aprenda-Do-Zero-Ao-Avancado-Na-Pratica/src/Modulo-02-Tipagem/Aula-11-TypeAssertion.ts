let status2: unknown = 10;

// Estou afirmando que o tipo é um number
let changeStatus = status2 as number;

// Outra maneira de afirmar o tipo
changeStatus = <number>status2;
