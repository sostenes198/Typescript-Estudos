import "reflect-metadata";

// Define a decorator to add a role to a user
function Role(role: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata("role", role, target, propertyKey);
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      // check for permission here
      if (!checkRole(role)) {
        throw new Error("Access Denied");
      }

      return originalMethod.apply(this, args);
    };
  };

  function checkRole(role: string): Boolean {
    return true;
  }
}

class User {
  private _username: string;
  private _password: string;

  constructor(username: string, password: string) {
    this._username = username;
    this._password = password;
  }

  @Role("admin")
  getUsername() {
    return this._username;
  }

  @Role("admin")
  setPassword(password: string) {
    this._password = password;
  }

  @Role("user")
  changePassword(oldPassword: string, newPassword: string) {
    if (this._password === oldPassword) {
      this._password = newPassword;
    } else {
      throw new Error("Invalid password");
    }
  }
}

const user = new User("JohnDoe", "password123");

const role = Reflect.getMetadata("role", user, "getUsername");
console.log(role); // "admin"

const role2 = Reflect.getMetadata("role", user, "changePassword");
console.log(role2); // "user"
