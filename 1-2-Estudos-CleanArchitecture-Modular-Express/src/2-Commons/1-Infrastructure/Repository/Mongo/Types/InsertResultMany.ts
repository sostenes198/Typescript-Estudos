// TODO TESTAR AQUI

export class InsertResultMany {
    private constructor(
        public readonly isSuccess: boolean,
        public readonly insertedCount: number,
        public readonly insertedIds: number[],
    ) {}

    public static Success(insertedCount: number, insertedIds: number[]): InsertResultMany {
        return new InsertResultMany(true, insertedCount, insertedIds);
    }

    public static Fail(): InsertResultMany {
        return new InsertResultMany(false, 0, []);
    }
}
