enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

type DirectionType = typeof Direction[keyof typeof Direction];

// DirectionType agora é 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const color = 'red';
type ColorType = typeof color;

// ColorType agora é 'red'

function greet(name: string): string {
  return `Hello, ${name}!`;
}

type GreetFunctionType = typeof greet;

// GreetFunctionType agora é (name: string) => string

const person = {
  name: 'John',
  age: 30,
};

type AgeType = typeof person.age;

// AgeType agora é 'number'

const myNumber = 42;
type MyNumberType = typeof myNumber;

// MyNumberType agora é 'number'