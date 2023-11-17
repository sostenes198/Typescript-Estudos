// TODO TESTAR AQUI
export class InsertResult {
    private constructor(
        public readonly isSuccess: boolean,
        public readonly insertedId: number,
    ) {}

    public static Success(insertedId: number): InsertResult {
        return new InsertResult(true, insertedId);
    }

    public static Fail(): InsertResult {
        return new InsertResult(false, 0);
    }
}
