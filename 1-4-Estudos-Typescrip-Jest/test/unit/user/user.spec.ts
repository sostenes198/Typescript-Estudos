import { User, UserRepo, UserService, UserInput, ComplextType } from "@/user/user";
import { assertGettersObj as assertGettersSettersObj, assertPropertiesObj, assertPropertiesWithValueObj, assertSettersObj } from "../../extensions/jestextensions";

type CreateUserScenarioType = {
    name: string,
    userInput: UserInput,
    fn: (userInput: User, fn: jest.Mocked<UserRepo>) => void;
    expectedUser: User;
};

type UserPropertiesScenarioType = {
    user: User;
    name: string;
    age: number;
    phone: string;
    isEmpty: boolean;
};

const createUseScenarios: Array<CreateUserScenarioType> = [
    {
        name: "Scenario - 1",
        userInput: {
            age: 18,
            name: "Test",
            phone: "12312"
        },
        fn: assertHaveBeenCalled,
        expectedUser: new User("Test", 18, "12312")
    },
    {
        name: "Scenario - 2",
        userInput: {
            age: 19,
            name: "Test",
            phone: "12312"
        },
        fn: assertHaveBeenCalled,
        expectedUser: new User("Test", 19, "12312")
    },
    {
        name: "Scenario - 3",
        userInput: {
            age: 17,
            name: "Test",
            phone: "12312"
        },
        fn: assertNotHaveBeenCalled,
        expectedUser: User.Empty()
    }
];

const userPropertiesScenarios: Array<UserPropertiesScenarioType> = [
    {
        user: new User("Test", 5, "59859"),
        name: "Test",
        age: 5,
        phone: "59859",
        isEmpty: false
    },
    {
        user: User.Empty(),
        name: "",
        age: 0,
        phone: "",
        isEmpty: true
    }
];

function assertHaveBeenCalled(user: User, fn: jest.Mocked<UserRepo>): void {
    expect(fn.create).toHaveBeenCalledWith(user);
    expect(fn.create).toBeCalledTimes(1);
}

function assertNotHaveBeenCalled(user: User, fn: jest.Mocked<UserRepo>): void {
    expect(fn.create).not.toHaveBeenCalled();
    expect(fn.create).toBeCalledTimes(0);
}

describe('UserService', () => {

    let sust: UserService;
    let userRepository: jest.Mocked<UserRepo>;

    beforeEach(() => {
        userRepository = {
            create: jest.fn()
        };
        sust = new UserService(userRepository);
    });

    test.each(createUseScenarios)('Should Create Users $name', async (createUserScenario: CreateUserScenarioType) => {
        // arrange
        userRepository.create.mockResolvedValue();

        // act
        let userResult: User = await sust.create(createUserScenario.userInput);

        // assert
        expect(userResult).toStrictEqual(createUserScenario.expectedUser);
        createUserScenario.fn(createUserScenario.expectedUser, userRepository);
    });

});

describe('User Type', () => {
    const userInput: UserInput = {
        age: 10,
        name: "Test",
        phone: "12321"
    };

    test('Assert properties', () => {

        assertPropertiesObj(userInput, [
            {
                propertyName: "age",
                typeProperty: "number"
            },
            {
                propertyName: "name",
                typeProperty: "string"
            },
            {
                propertyName: "phone",
                typeProperty: "string"
            }
        ]);
    });

    test('Assert properties with value', () => {
        assertPropertiesWithValueObj(userInput, [
            {
                propertyName: "age",
                typeProperty: "number",
                propertyValue: 10
            },
            {
                propertyName: "name",
                typeProperty: "string",
                propertyValue: "Test"
            },
            {
                propertyName: "phone",
                typeProperty: "string",
                propertyValue: "12321"
            }
        ]);
    });
});

describe('Complex Type', () => {
    const completType: ComplextType = {
        id: "1",
        numbers: [1, 2, 3],
        fn: (param1: string, param2: number, ...param3: string[]): number => { return 10; },
        userInput: {
            age: 10,
            name: "Test",
            phone: "123"
        }
    };

    test('Assert properties with value', () => {
        assertPropertiesWithValueObj(completType, [
            {
                propertyName: "id",
                typeProperty: "string",
                propertyValue: "1"
            },
            {
                propertyName: "numbers",
                typeProperty: "object",
                propertyValue: [1, 2, 3]
            },
            {
                propertyName: "fn",
                typeProperty: "function",
                propertyValue: (param1: string, param2: number, ...param3: string[]): number => { return 10; },
            },
            {
                propertyName: "userInput",
                typeProperty: "object",
                propertyValue: {
                    age: 10,
                    name: "Test",
                    phone: "123"
                } as UserInput
            }
        ]);
    });
});

describe('User', () => {
    test.each(userPropertiesScenarios)('Assert properties with value', (scenario: UserPropertiesScenarioType) => {
        assertPropertiesWithValueObj(scenario.user, [
            {
                propertyName: "name",
                typeProperty: "string",
                propertyValue: scenario.name
            },
            {
                propertyName: "age",
                typeProperty: "number",
                propertyValue: scenario.age
            },
            {
                propertyName: "phone",
                typeProperty: "string",
                propertyValue: scenario.phone
            },
            {
                propertyName: "isEmpty",
                typeProperty: "boolean",
                propertyValue: scenario.isEmpty
            },
        ]);
    });

    test.each([
        [new User('Test', 17, '123321'), false],
        [new User('Test', 18, '123321'), true],
        [new User('Test', 19, '123321'), true]
    ])('Assert canRegister user', (user: User, expectedResult: boolean) => {
        expect(user.canRegister()).toBe(expectedResult);
    });

    test('Validate Gette/Setter', () => {
        const user: User = new User('Test', 17, '123321');

        assertGettersSettersObj(user,
            [
                {
                    privatePropertyName: 'name',
                    propertyName: 'Name',
                },
                {
                    privatePropertyName: 'age',
                    propertyName: 'Age',
                },
                {
                    privatePropertyName: 'phone',
                    propertyName: 'Phone',
                }
            ]);

        assertSettersObj(user,
            [
                {
                    privatePropertyName: 'phone',
                    propertyName: 'Phone',
                    newValue: 'NewPhone'
                }
            ]);
    });
});