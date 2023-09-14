import { StartUpRunner } from './StartUpRunner';

export interface StartUpBuilder {
    Build(): StartUpRunner;
}
