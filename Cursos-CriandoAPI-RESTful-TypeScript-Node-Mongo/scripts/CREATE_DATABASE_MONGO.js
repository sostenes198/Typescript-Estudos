db = db.getSiblingDB('admin');
db.auth('root', 'Password');

db = db.getSiblingDB('db_portal');

db.createUser(
  {
    user: "root",
    pwd: "Password",
    roles: [ { role: "dbOwner", db: "db_portal" } ]
  }
)

db.createCollection('news')

db.news.insertMany([
  {
    title: 'News BasicInsert',
    text: 'ADICIONADO VIA SCRIPT',
    author: 'DOCKER',
    active: 'true'
   }
 ]);