export interface UserRepo {
    create(user: User): Promise<void>;
}

abstract class BaseClass {
    protected abstract Equals(): boolean;

    protected ToString(): string {
        return '';
    }
}

export class User extends BaseClass {
    private readonly name: string;
    private readonly age: number;
    private phone: string;

    private isEmpty: boolean = false;


    public constructor(name: string, age: number, phone: string) {
        super();
        this.name = name;
        this.age = age;
        this.phone = phone;
    }

    public static Empty(): User {
        const newUser = new User("", 0, "");
        newUser.isEmpty = true;
        return newUser;
    }

    public override Equals(): boolean {
        return false;
    }

    public override ToString(): string {
        return `{name:${this.name},age:${this.age},phone:${this.phone}}`;
    }

    get Name(): string {
        return this.name;
    }

    get Age(): number {
        return this.age;
    }

    get Phone(): string {
        return this.phone;
    }

    set Phone(newPhone: string) {
        this.phone = newPhone;
    }

    get IsEmpty(): boolean {
        return this.isEmpty;
    };


    public canRegister(): boolean {
        return this.age >= 18;
    }
}
export type UserInput = {
    name: string;
    age: number;
    phone: string;
};

export type ComplextType = {
    id: string;
    numbers: Array<number>;
    fn: (param1: string, param2: number, ...param3: string[]) => number;
    userInput: UserInput;
};

export class UserService {
    private readonly repo: UserRepo;

    constructor(repo: UserRepo) {
        this.repo = repo;
    }

    async create(userInput: UserInput): Promise<User> {
        const user = new User(userInput.name, Number(userInput.age), userInput.phone);
        if (user.canRegister()) {
            await this.repo.create(user);
            return user;
        }

        return User.Empty();
    }

}