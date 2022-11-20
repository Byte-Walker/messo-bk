//Express js setup
const express = require('express');
const app = express();
const ObjectId = require('mongodb').ObjectId;
app.use(express.json());

//MongoDB setup
const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://messo:fpWHbLYehP7P27kN@cluster0.5pp73.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect();
const db = client.db('messo');

//Cors setup
const cors = require('cors');
app.use(cors());

//Accessing collections
const usersCollection = db.collection('users');
const foodsCollection = db.collection('foods');

async function run() {
  try {
    app.get('/', async (req, res) => {
      const cursor = usersCollection.find({});
      const users = await cursor.toArray();
      res.json(users);
    });

    app.get('/foods', async (req, res) => {
      const cursor = foodsCollection.find({});
      const foodsList = await cursor.toArray();

      res.send(foodsList);
    });

    // Api for creating account
    app.post('/create_account', async (req, res) => {
      const userInfo = req.body;

      //Checking if the data exists
      const cursor = usersCollection.find({ email: userInfo.email });
      const user = await cursor.toArray();
      try {
        if (!user[0]?.email) {
          // Inserting data into the database
          usersCollection.insertOne(userInfo);
          res.send(true);
        }
        res.send(false);
      } catch (e) {
        console.log('Error inserting user: ' + e);
      }
    });

    //Api for logging in
    app.post('/login', async (req, res) => {
      const email = req.body.email;
      const password = req.body.password;

      const cursor = usersCollection.find({ email: email });
      const users = await cursor.toArray();
      console.log(users[0]);
      if (users[0]) {
        if (users[0].password === password) {
          delete users[0].password;
          res.send(users[0]);
        } else {
          res.send(false);
        }
      } else {
        res.send(false);
      }
    });

    //get user api
    app.get('/get_user/:email', async (req, res) => {
      const email = req.params.email;
      const cursor = usersCollection.find({ email: email });
      const users = await cursor.toArray();
      res.send(users[0]);
    });
  } finally {
  }
}

run();

// Listening
const port = 5000;
app.listen(port, () => console.log('Listening on port ' + port));
