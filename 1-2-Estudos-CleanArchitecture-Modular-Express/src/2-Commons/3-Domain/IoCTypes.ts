export default class IocTypes {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    get Value(): string {
        return this._value;
    }
}
