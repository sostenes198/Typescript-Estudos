import { StartUpRunner } from './StartUpRunner';

export interface StartUpBuilder {
    Build(): Promise<StartUpRunner>;
}
