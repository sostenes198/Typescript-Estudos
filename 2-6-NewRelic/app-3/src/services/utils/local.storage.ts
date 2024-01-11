import { AsyncLocalStorage } from "async_hooks";

enum PosixSignal {
  Interrupt = 'SIGINT',
  Quit = 'SIGQUIT',
  TerminationSignal = 'SIGTERM',
}

class LocalStorage {
  public static Instance: LocalStorage;

  private cls: AsyncLocalStorage<any> | undefined;

  constructor() {
    if (LocalStorage.Instance) {
      throw new Error(
        "Error: Instantiation failed, use LocalStorage.createInstance() instead of new"
      );
    }
  }

  public static createInstance(): LocalStorage {
    this.Instance = this.Instance || new this();

    Object.values(PosixSignal).forEach((item: string) => {
      process.once(item, () => storage.exit());
    });
    return this.Instance;
  }

  public startStorage<T>() {
    this.cls = this.cls || new AsyncLocalStorage<T>();
    return this.cls;
  }

  public exit() {
    if (!this.cls) return;
    this.cls.enterWith(undefined);
    this.cls.disable();
  }

  public setLogger(logger: unknown) {
    if (!this.cls) return;
    const store = this.cls.getStore();
    this.cls.enterWith({ ...store, logger });
  }

  public getLogger() {
    if (this.cls) {
      const store = this.cls.getStore();
      if (store?.logger) return store?.logger;
    }
    return null;
  }
}

const storage = LocalStorage.createInstance();
storage.startStorage();

export { storage };