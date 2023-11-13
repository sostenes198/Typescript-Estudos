export class Utils {
    public static async Delay(timeInMs: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, timeInMs);
        });
    }
}
