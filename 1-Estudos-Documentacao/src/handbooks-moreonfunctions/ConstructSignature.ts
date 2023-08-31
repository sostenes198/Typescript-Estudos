class SomeObject {
    private readonly _s: string;
    constructor(s: string) {
        this._s = s;
    }

    get s(): string {
        return this._s;
    }
}

type SomeConstructor = {
    new(s: string): SomeObject;
};

function fn(ctor: SomeConstructor) {
    return new ctor("hello");
}

const someObjectInitialize = fn(SomeObject);

console.log(someObjectInitialize);
console.log(someObjectInitialize.s);