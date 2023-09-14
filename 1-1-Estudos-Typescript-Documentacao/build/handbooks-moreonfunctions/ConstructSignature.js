"use strict";
class SomeObject {
    constructor(s) {
        this._s = s;
    }
    get s() {
        return this._s;
    }
}
function fn(ctor) {
    return new ctor("hello");
}
const someObjectInitialize = fn(SomeObject);
console.log(someObjectInitialize);
console.log(someObjectInitialize.s);
