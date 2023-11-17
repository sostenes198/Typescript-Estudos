db = db.getSiblingDB('admin');
db.auth('root', 'Password');

db = db.getSiblingDB('CleanArchitecture');

db.createUser({
    user: 'root',
    pwd: 'Password',
    roles: [{ role: 'dbOwner', db: 'CleanArchitecture' }],
});

db.createCollection('to_tests');

db.getCollection('to_tests').insertOne({
    Prop1: '1_Prop1',
    Prop2: '1_Prop2',
    Prop3: 100,
    Prop4: true,
    Prop5: {
        Prop1: '1_Prop1',
        Prop2: '1_Prop2',
        Prop3: 100,
        Prop4: true,
    },
});

db.getCollection('to_tests').insertOne({
    Prop1: '2_Prop1',
    Prop2: '2_Prop2',
    Prop3: 200,
    Prop4: false,
    Prop5: {
        Prop1: '2_Prop1',
        Prop2: '2_Prop2',
        Prop3: 200,
        Prop4: false,
    },
});

db.getCollection('to_tests').insertOne({
    Prop1: '3_Prop1',
    Prop2: '3_Prop2',
    Prop3: 300,
    Prop4: true,
    Prop5: {
        Prop1: '3_Prop1',
        Prop2: '3_Prop2',
        Prop3: 300,
        Prop4: true,
    },
});
