import { Container, interfaces, inject, injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { IocTypes } from './IoCTypes';
import 'reflect-metadata';

export type PostConfigureAction = (container: Container) => void;

export class InternalContainer implements Disposable {
    private _container: Container;

    constructor(container: Container) {
        this._container = container;
    }

    [Symbol.dispose](): void {
        this.remove();
    }

    get Container(): Container {
        return this._container;
    }

    public remove(): void {
        if (this._container) {
            this._container.unbindAll();
            this._container = null!;
        }
    }
}

export interface ServiceLocator {
    readonly Container: Container;
}

@injectable()
export class ServiceLocatorImp implements ServiceLocator {
    public readonly Container: Container;

    constructor(container: Container) {
        this.Container = container;
    }
}

export class AppContainer {
    private constructor() {}

    private static _containerOptions: interfaces.ContainerOptions;

    private static _globalContainer: InternalContainer;

    private static _postConfigureContainerActions: PostConfigureAction[] = [this.defaultGlobalConfigurationsContainer];

    public static createGlobalContainer(fnConfigure: PostConfigureAction, containerOptions?: interfaces.ContainerOptions) {
        if (!this._globalContainer) {
            this._postConfigureContainerActions.push(fnConfigure);
            this._containerOptions = containerOptions ?? {};
            const container = new Container(this._containerOptions);
            fnConfigure(container);
            this._globalContainer = new InternalContainer(container);
            this._postConfigureContainerActions.forEach((action) => action(this._globalContainer.Container));
        }
    }

    public static globalContainer(): Container {
        if (!this._globalContainer) throw new Error('Global Container not configured');
        return this._globalContainer.Container;
    }

    public static createScope(): InternalContainer {
        const container = this.globalContainer().createChild(this._containerOptions);
        this._postConfigureContainerActions.forEach((action) => action(container));
        return new InternalContainer(container);
    }

    public static postConfigure(fn: PostConfigureAction): AppContainer {
        this._postConfigureContainerActions.push(fn);
        return this;
    }

    public static resetPostConfigureActions(): void {
        this._postConfigureContainerActions = [];
    }

    private static defaultGlobalConfigurationsContainer(container: Container): void {
        container
            .bind(IocTypes.SERVICE_LOCATOR)
            .toDynamicValue(() => {
                return new ServiceLocatorImp(container);
            })
            .inSingletonScope();
    }
}

export interface Warrior {
    fight(): string;
    sneak(): string;
}

export interface Weapon {
    hit(): string;
}

export interface ThrowableWeapon {
    throw(): string;
}

@injectable()
export class Katana implements Weapon {
    private id: string = uuidv4();
    public hit() {
        return 'cut!';
    }
}

@injectable()
export class Shuriken implements ThrowableWeapon {
    private id: string = uuidv4();
    public throw() {
        return 'hit!';
    }
}

@injectable()
export class Ninja implements Warrior {
    private id: string = uuidv4();

    private _internalContainer: ServiceLocator;
    private _katana: Weapon;
    private _shuriken: ThrowableWeapon;

    public constructor(@inject(IocTypes.SERVICE_LOCATOR) locator: ServiceLocator, @inject(IocTypes.WEAPON) b: Weapon, @inject(IocTypes.THROWABLEWEAPON) c: ThrowableWeapon) {
        this._internalContainer = locator;
        this._katana = b;
        this._shuriken = c;
    }

    public fight() {
        return this._katana.hit();
    }
    public sneak() {
        return this._shuriken.throw();
    }
}

AppContainer.createGlobalContainer((container: Container) => {
    container.bind<Warrior>(IocTypes.WARRIOR).to(Ninja).inSingletonScope();
    container.bind<Weapon>(IocTypes.WEAPON).to(Katana).inSingletonScope();
    container.bind<ThrowableWeapon>(IocTypes.THROWABLEWEAPON).to(Shuriken).inTransientScope();
});

// const x = AppContainer.globalContainer().get<ServiceLocator>(IocTypes.SERVICE_LOCATOR);

// console.log(x);

const a = AppContainer.createScope();
const aa = a.Container.get<Warrior>(IocTypes.WARRIOR);
const aaa = a.Container.get<Warrior>(IocTypes.WARRIOR);
const aaaa = a.Container.get<ThrowableWeapon>(IocTypes.THROWABLEWEAPON);
const aaaaa = a.Container.get<ThrowableWeapon>(IocTypes.THROWABLEWEAPON);
const aaaaaa = a.Container.get<ServiceLocator>(IocTypes.SERVICE_LOCATOR);

console.log(a);
console.log(aa);
console.log(aaa);
console.log(aaaa);
console.log(aaaaa);
console.log(aaaaaa);

const b = AppContainer.createScope();
const bb = b.Container.get<Warrior>(IocTypes.WARRIOR);
const bbb = b.Container.get<Warrior>(IocTypes.WARRIOR);
const bbbb = b.Container.get<ThrowableWeapon>(IocTypes.THROWABLEWEAPON);
const bbbbb = b.Container.get<ThrowableWeapon>(IocTypes.THROWABLEWEAPON);
const bbbbbb = b.Container.get<ServiceLocator>(IocTypes.SERVICE_LOCATOR);

console.log(b);
console.log(bb);
console.log(bbb);
console.log(bbbb);
console.log(bbbbb);
console.log(bbbbbb);
