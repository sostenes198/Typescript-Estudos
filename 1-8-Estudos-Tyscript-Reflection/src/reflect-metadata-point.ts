import "reflect-metadata";

class Point {
  constructor(public x: number, public y: number) {}
}

class Line {
  private _start?: Point;
  private _end?: Point;

  @validate()
  set start(value: Point) {
    this._start = value;
  }

  get start() {
    return this._start ?? new Point(0, 0);
  }

  @validate()
  set end(value: Point) {
    this._end = value;
  }

  get end() {
    return this._end ?? new Point(0, 0);
  }
}

function validate<T>() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    let set = descriptor.set!;

    Reflect.defineMetadata("test", "ASDASd", target)

    descriptor.set = function (value: T) {
      let x = Reflect.ownKeys(target);
      let a = Reflect.getOwnMetadataKeys(target);
      let y = Reflect.getMetadataKeys(target);

      let type = Reflect.getMetadata("design:type", target, propertyKey);

      if (!(value instanceof type)) {
        throw new TypeError(
          `Invalid type, got ${typeof value} not ${type.name}.`
        );
      }

      set.call(this, value);
    };
  };
}

const line = new Line();
line.start = new Point(0, 0);

// @ts-ignore
// line.end = {}

// Fails at runtime with:
// > Invalid type, got object not Point
