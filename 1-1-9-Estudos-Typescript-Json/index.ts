import { objToJsonConverter, TestClass } from "./src";

const testClass = new TestClass();

const result = objToJsonConverter<TestClass>(testClass)
console.log(result);