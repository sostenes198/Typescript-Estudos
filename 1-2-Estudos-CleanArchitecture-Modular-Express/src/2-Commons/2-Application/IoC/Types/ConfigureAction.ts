import { ServiceProvider } from '@/2-Commons/2-Application/IoC/ServiceProvider';

export type ConfigureAction = (Container: ServiceProvider) => void;
