import * as awilix from "awilix";

const container = awilix.createContainer({
  injectionMode: "PROXY",
});

class UserController {
  private readonly userService: any;
  constructor(opts: any) {
    // Save a reference to our dependency.
    this.userService = opts.userService;
  }

  // imagine ctx is our HTTP request context...
  getUser(ctx: any) {
    return this.userService.getUser("ctx.params.id");
  }
}

const makeUserService = ({ db }) => {
  // Notice how we can use destructuring
  // to access dependencies
  return {
    getUser: (id: any) => {
      return db.query(`select * from users where id=${id}`);
    },
  };
};

class Database {
  private readonly conn = {
    rawSql: (sql) => console.log(sql),
  };

  private readonly connectionString;
  private readonly timeout;

  constructor(connectionString, timeout) {
    this.connectionString = connectionString;
    this.timeout = timeout;
  }

  query(sql) {
    console.log(this.connectionString);
    console.log(this.timeout);
    return this.conn.rawSql(sql);
  }
}

container.register({
  // Here we are telling Awilix how to resolve a
  // userController: by instantiating a class.
  userController: awilix.asClass(UserController),
  connectionString: awilix.asValue("ASDASD"),
  timeout: awilix.asValue(1000),
  db: awilix.asClass(Database).classic(),
  userService: awilix.asFunction(makeUserService),
});

const test = container.resolve("userController");

test.getUser();
