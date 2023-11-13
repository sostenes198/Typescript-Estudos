import { Options } from '@/2-Commons/2-Application/Options/Options';

export class OptionsImp<T extends object> implements Options<T> {
    public readonly Value: T;

    constructor(value: T) {
        this.Value = value;
    }
}
