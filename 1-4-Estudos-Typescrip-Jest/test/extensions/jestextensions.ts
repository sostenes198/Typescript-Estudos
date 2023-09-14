import 'reflect-metadata';

type types = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";

type AssertPropertiesObj = {
    propertyName: string,
    typeProperty: types;
};

type AssertPropertiesWithValueObj = {
    propertyName: string;
    propertyValue: unknown;
    typeProperty: types;
};

type AssertGetPropertiesObj = {
    privatePropertyName: string;
    propertyName: string;
};

type AssertSetterPropertiesObj = {
    privatePropertyName: string;
    propertyName: string;
    newValue: Object;
};

export function assertPropertiesObj(obj: Object, assertProperties: Array<AssertPropertiesObj>): void {
    const expectedProperties: string[] = Object.keys(obj);
    const properties: string[] = assertProperties.map((value: AssertPropertiesObj) => value.propertyName);

    expect(properties).toStrictEqual(expectedProperties);
    
    assertProperties.forEach(element => {
        let describe: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(obj, element.propertyName)!;
        let type: types = typeof (describe.value);
        expect(type).toStrictEqual(element.typeProperty);
    });
}

export function assertPropertiesWithValueObj(obj: Object, assertProperties: Array<AssertPropertiesWithValueObj>): void {
    const expectedProperties: string[] = Object.keys(obj);
    const properties: string[] = assertProperties.map((value: AssertPropertiesObj) => value.propertyName);

    expect(properties).toStrictEqual(expectedProperties);

    assertProperties.forEach(element => {
        let describe: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(obj, element.propertyName)!;
        let type: types = typeof (describe.value);
        expect(type).toStrictEqual(element.typeProperty);
        if (type != "function")
            expect(element.propertyValue).toStrictEqual(describe.value);
        else {
            expect((element.propertyValue as Function).toString()).toStrictEqual((describe.value as Function).toString());
        }
    });
}

export function assertGettersObj(obj: Object, proprties: Array<AssertGetPropertiesObj>): void {
    const proto = Object.getPrototypeOf(obj);
    proprties.forEach(element => {
        const descriptorProto: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(proto, element.propertyName)!;
        const descriptorProperty: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(obj, element.privatePropertyName)!;
        expect(descriptorProto).not.toBeNull();
        expect(descriptorProperty).not.toBeNull();
        expect(descriptorProto.get?.call(obj)).toStrictEqual(descriptorProperty.value);
    });
}

export function assertSettersObj(obj: Object, proprties: Array<AssertSetterPropertiesObj>): void {
    const proto = Object.getPrototypeOf(obj);
    proprties.forEach(element => {
        const descriptorProto: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(proto, element.propertyName)!;
        expect(descriptorProto).not.toBeNull();
        descriptorProto.set?.call(obj, element.newValue);

        const descriptorProperty: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(obj, element.privatePropertyName)!;
        expect(descriptorProperty).not.toBeNull();
        expect(descriptorProperty.value).toStrictEqual(element.newValue);
    });
}