import { TsDataType } from '@/2-Commons/3-Domain/Types/TsDataType';

export class StringUtils {
    public static IsNullUndefinedOrEmpty(obj: TsDataType): boolean {
        if (obj === null || obj === undefined) return true;

        switch (typeof obj) {
            case 'string':
                return obj === '';
            case 'number':
                return obj === 0;
            case 'boolean':
                return !obj;
            case 'symbol':
                return obj.description === '';
            case 'object':
                return Object.keys(obj).length === 0;
            default:
                return true;
        }
    }
}
