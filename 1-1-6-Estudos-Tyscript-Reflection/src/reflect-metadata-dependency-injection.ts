import "reflect-metadata";

function Injectable() {
  return function (target: any) {
    Reflect.defineMetadata("injectable", true, target);
  };
}

@Injectable()
class MyDependency {
  doSomething() {
    console.log("MyDependency is doing something");
  }
}

@Injectable()
class MyService {
  constructor(private _dependency: MyDependency) {}

  doSomething() {
    this._dependency.doSomething();
  }
}

class DependencyInjection {
  static get<T>(target: any): T {
    const isInjectable = Reflect.getMetadata("injectable", target);
    if (!isInjectable) {
      throw new Error("Target is not injectable");
    }

    const dependencies = Reflect.getMetadata("design:paramtypes", target) as Array<any> || [];
    const instances = dependencies.map((dep: any) =>
      DependencyInjection.get(dep)
    );
    return new target(...instances);
  }
}

const myService = DependencyInjection.get<MyService>(MyService);
myService.doSomething(); // "MyDependency is doing something"
