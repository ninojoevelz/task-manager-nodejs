const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const connectionURL = 'mongodb://127.0.0.1:27017';
const databaseName = 'task-manager';

MongoClient.connect(connectionURL , { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
    if (error) {
        return console.log('Unable to connect to database!');
    }

    console.log('Connected successfully!');

    const db = client.db(databaseName);

    // db.collection('users').insertOne({
    //     name: 'Joevel',
    //     age: 24
    // }, (error, result) => {
    //     if (error) {
    //         return console.log('Unable to insert the user!');
    //     }

    //     console.log(result.ops);
    // });

    db.collection('users').insertMany([
        { name: 'One', age: 1 },
        { name: 'Two', age: 2 }
    ], (error, result) => {
        if (error) {
            return console.log('Unable to insert the user!');
        }

        console.log(result.ops);
    })
});
