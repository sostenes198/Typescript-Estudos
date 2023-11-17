// TODO TESTAR AQUI
export class DeleteResult {
    private constructor(
        public readonly isSuccess: boolean,
        public readonly deletedCount: number,
    ) {}

    public static Success(deletedCount: number): DeleteResult {
        return new DeleteResult(true, deletedCount);
    }

    public static Fail(): DeleteResult {
        return new DeleteResult(false, 0);
    }
}
