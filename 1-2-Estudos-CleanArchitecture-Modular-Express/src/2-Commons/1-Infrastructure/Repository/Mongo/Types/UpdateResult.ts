// TODO TESTAR AQUI
export class UpdateResult {
    private constructor(public readonly isSuccess: boolean) {}

    public static Success(): UpdateResult {
        return new UpdateResult(true);
    }

    public static Fail(): UpdateResult {
        return new UpdateResult(false);
    }
}
