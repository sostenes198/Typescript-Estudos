// TODO TESTAR AQUI NOVAMENTE

export default class IocTypes {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    public get Value(): string {
        return this._value;
    }

    public static get Configuration(): IocTypes {
        return new IocTypes('Configuration');
    }

    public static get MongoOption(): IocTypes {
        return new IocTypes('MongoOption');
    }

    public static get MongoService(): IocTypes {
        return new IocTypes('MongoService');
    }
}
