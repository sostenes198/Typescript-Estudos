import { ServiceProvider } from '@/4-CrossCuting/1-IoC/Base/Interfaces/ServiceProvider';

export type ConfigureAction = (Container: ServiceProvider) => void;