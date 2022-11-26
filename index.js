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
const exercisesCollection = db.collection('exercises');

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

    // ---------------------------------------------------------
    // get diet chart
    app.post('/build_diet_chart', async (req, res) => {
      const cursor = foodsCollection.find({});
      const foods = await cursor.toArray();
      console.log('hit build chart');

      const quantityCalculator = (id, requiredCalories) => {
        const result = foods.find((element) => element.id.trim() === id.trim());
        const qty = (100 / result?.calories) * requiredCalories;
        return parseInt(qty);
      };

      let {
        age,
        weight,
        height,
        gender,
        type,
        target,
        loseAmount,
        gainAmount,
        duration,
        activity,
      } = req.body;
      console.log(req.body);
      loseAmount = parseInt(loseAmount);
      gainAmount = parseInt(gainAmount);

      //Calculating BMI
      const bmi = weight / (height * height);

      //Calculating ideal calories intake
      let activityFactor;
      if (activity === 'Inactive') {
        activityFactor = 1.2;
      } else if (activity === 'Slightly active') {
        activityFactor = 1.3;
      } else {
        activityFactor = 1.4;
      }

      let bmr;
      if (gender === 'Male') {
        bmr = 66.5 + 13.75 * weight + 5.003 * height - 6.75 * age;
      } else {
        bmr = 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
      }

      const idealCalories = bmr * activityFactor;
      let targetedCalories = idealCalories;

      if (target === 'Lose Weight') {
        const deficitPerDay =
          (parseInt(loseAmount) * 7700) / (parseInt(duration) * 30);
        targetedCalories = targetedCalories - deficitPerDay;
      } else if (target === 'Gain Weight') {
        const appendPerDay =
          (parseInt(gainAmount) * 7700) / (parseInt(duration) * 30);
        targetedCalories = targetedCalories + appendPerDay;
      }
      console.log('targetedCalories: ', targetedCalories);
      console.log('idealCalories: ', idealCalories);

      const breakfast = parseInt(targetedCalories * 0.3);
      const midMeal = parseInt(targetedCalories * 0.05);
      const beforeLunch = parseInt(targetedCalories * 0.05);
      const lunch = parseInt(targetedCalories * 0.25);
      const evening = parseInt(targetedCalories * 0.1);
      const dinner = parseInt(targetedCalories * 0.2);
      const afterDinner = parseInt(targetedCalories * 0.05);
      let dietChart;

      if (foods.length) {
        if (type === 'Vegetarian') {
          dietChart = {
            clientId: 32434,
            idealCalories: parseInt(idealCalories),
            targetedCalories: parseInt(targetedCalories),
            water: 3,
            salt: 1,
            sugar: 3,
            oil: 5,
            targetToLose: 5,
            breakfast: {
              time: '8:00AM to 8:30AM',
              calories: breakfast,
              foods: [
                {
                  id: 'fr-7',
                  quantity: quantityCalculator('fr-7', breakfast / 2),
                },
                {
                  id: 'fr-11',
                  quantity: quantityCalculator('fr-11', breakfast / 2),
                },
              ],
            },
            midMeal: {
              time: '10:30AM to 11:00 AM',
              calories: midMeal,
              foods: [
                {
                  id: 'wg-7',
                  quantity: quantityCalculator('wg-7', midMeal / 2),
                },
                {
                  id: 'ld-2',
                  quantity: quantityCalculator('ld-2', midMeal / 2),
                },
              ],
            },
            beforeLunch: {
              time: '12:00PM',
              calories: beforeLunch,
              foods: [
                {
                  id: 'ld-11',
                  quantity: quantityCalculator('ld-11', beforeLunch),
                },
              ],
            },
            lunch: {
              time: '2:00PM to 2:30PM',
              calories: lunch,
              foods: [
                {
                  id: 'wg-1',
                  quantity: quantityCalculator('wg-1', lunch / 12),
                },
                {
                  id: 'lp-14',
                  quantity: quantityCalculator('lp-14', lunch / 12),
                },
                {
                  id: 'ld-2',
                  quantity: quantityCalculator('ld-2', lunch / 12),
                },
                {
                  id: 've-14',
                  quantity: quantityCalculator('ve-14', lunch / 12),
                },
                {
                  id: 've-1',
                  quantity: quantityCalculator('ve-1', lunch / 12),
                },
                {
                  id: 've-10',
                  quantity: quantityCalculator('ve-10', lunch / 12),
                },
                {
                  id: 've-8',
                  quantity: quantityCalculator('ve-8', lunch / 12),
                },
                {
                  id: 've-7',
                  quantity: quantityCalculator('ve-7', lunch / 12),
                },
                {
                  id: 've-5',
                  quantity: quantityCalculator('ve-5', lunch / 12),
                },
                {
                  id: 've-9',
                  quantity: quantityCalculator('ve-9', lunch / 12),
                },
                {
                  id: 've-21',
                  quantity: quantityCalculator('ve-21', lunch / 12),
                },
                {
                  id: 'ld-10',
                  quantity: quantityCalculator('ld-10', lunch / 12),
                },
              ],
            },
            evening: {
              time: '5:00 PM to 5:30PM',
              calories: evening,
              foods: [
                {
                  id: 'fr-2',
                  quantity: quantityCalculator('fr-2', evening / 2),
                },
                {
                  id: 'fr-3',
                  quantity: quantityCalculator('fr-3', evening / 2),
                },
              ],
            },
            Dinner: {
              time: '8:00-8:30PM',
              calories: dinner,
              foods: [
                {
                  id: 'wg-9',
                  quantity: quantityCalculator('wg-9', dinner / 11),
                },
                {
                  id: 'ld-2',
                  quantity: quantityCalculator('ld-2', dinner / 11),
                },
                {
                  id: 've-14',
                  quantity: quantityCalculator('ve-14', dinner / 11),
                },
                {
                  id: 've-1',
                  quantity: quantityCalculator('ve-1', dinner / 11),
                },
                {
                  id: 've-10',
                  quantity: quantityCalculator('ve-10', dinner / 11),
                },
                {
                  id: 've-8',
                  quantity: quantityCalculator('ve-8', dinner / 11),
                },
                {
                  id: 've-7',
                  quantity: quantityCalculator('ve-7', dinner / 11),
                },
                {
                  id: 've-5',
                  quantity: quantityCalculator('ve-5', dinner / 11),
                },
                {
                  id: 've-9',
                  quantity: quantityCalculator('ve-9', dinner / 11),
                },
                {
                  id: 've-21',
                  quantity: quantityCalculator('ve-21', dinner / 11),
                },
                {
                  id: 'ld-10',
                  quantity: quantityCalculator('ld-10', dinner / 11),
                },
              ],
            },
            afterDinner: {
              time: '10:00PM to 10:30PM',
              calories: afterDinner,
              foods: [
                {
                  id: 'ld-11',
                  quantity: quantityCalculator('ld-11', afterDinner),
                },
              ],
            },
          };

          console.log('calculate diet chart hit');
        } else {
          dietChart = {
            clientId: 32434,
            idealCalories: parseInt(idealCalories),
            targetedCalories: parseInt(targetedCalories),
            water: 3,
            salt: 1,
            sugar: 3,
            oil: 5,
            targetToLose: 5,
            breakfast: {
              time: '8:00AM to 8:30AM',
              calories: breakfast,
              foods: [
                {
                  id: 'lp-2',
                  quantity: quantityCalculator('lp-2', breakfast / 3),
                },
                {
                  id: 'fr-7',
                  quantity: quantityCalculator('fr-7', breakfast / 3),
                },
                {
                  id: 'fr-11',
                  quantity: quantityCalculator('fr-11', breakfast / 3),
                },
              ],
            },
            midMeal: {
              time: '10:30AM to 11:00 AM',
              calories: midMeal,
              foods: [
                {
                  id: 'wg-7',
                  quantity: quantityCalculator('wg-7', midMeal / 3),
                },
                {
                  id: 'ld-2',
                  quantity: quantityCalculator('ld-2', midMeal / 3),
                },
                {
                  id: 'lp-1',
                  quantity: quantityCalculator('lp-1', midMeal / 3),
                },
              ],
            },
            beforeLunch: {
              time: '12:00PM',
              calories: beforeLunch,
              foods: [
                {
                  id: 'ld-11',
                  quantity: quantityCalculator('ld-11', beforeLunch),
                },
              ],
            },
            lunch: {
              time: '2:00PM to 2:30PM',
              calories: lunch,
              foods: [
                {
                  id: 'wg-1',
                  quantity: quantityCalculator('wg-1', lunch / 10),
                },
                {
                  id: 'ld-2',
                  quantity: quantityCalculator('ld-2', lunch / 10),
                },
                {
                  id: 've-14',
                  quantity: quantityCalculator('ve-14', lunch / 10),
                },
                {
                  id: 've-1',
                  quantity: quantityCalculator('ve-1', lunch / 10),
                },
                {
                  id: 've-10',
                  quantity: quantityCalculator('ve-10', lunch / 10),
                },
                {
                  id: 've-8',
                  quantity: quantityCalculator('ve-8', lunch / 10),
                },
                {
                  id: 've-7',
                  quantity: quantityCalculator('ve-7', lunch / 10),
                },
                {
                  id: 've-5',
                  quantity: quantityCalculator('ve-5', lunch / 10),
                },
                {
                  id: 've-9',
                  quantity: quantityCalculator('ve-9', lunch / 10),
                },
                {
                  id: 've-21',
                  quantity: quantityCalculator('ve-21', lunch / 10),
                },
              ],
            },
            evening: {
              time: '5:00 PM to 5:30PM',
              calories: evening,
              foods: [
                {
                  id: 'fr-2',
                  quantity: quantityCalculator('fr-2', evening / 2),
                },
                {
                  id: 'fr-3',
                  quantity: quantityCalculator('fr-3', evening / 2),
                },
              ],
            },
            Dinner: {
              time: '8:00-8:30PM',
              calories: dinner,
              foods: [
                {
                  id: 'wg-2',
                  quantity: quantityCalculator('wg-2', dinner / 10),
                },
                {
                  id: 'ld-2',
                  quantity: quantityCalculator('ld-2', dinner / 10),
                },
                {
                  id: 've-14',
                  quantity: quantityCalculator('ve-14', dinner / 10),
                },
                {
                  id: 've-4',
                  quantity: quantityCalculator('ve-4', dinner / 10),
                },
                {
                  id: 've-10',
                  quantity: quantityCalculator('ve-10', dinner / 10),
                },
                {
                  id: 've-3',
                  quantity: quantityCalculator('ve-3', dinner / 10),
                },
                {
                  id: 've-7',
                  quantity: quantityCalculator('ve-7', dinner / 10),
                },
                {
                  id: 've-5',
                  quantity: quantityCalculator('ve-5', dinner / 10),
                },
                {
                  id: 've-9',
                  quantity: quantityCalculator('ve-9', dinner / 10),
                },
                {
                  id: 've-21',
                  quantity: quantityCalculator('ve-21', dinner / 10),
                },
              ],
            },
            afterDinner: {
              time: '10:00PM to 10:30PM',
              calories: afterDinner,
              foods: [
                {
                  id: 'ld-11',
                  quantity: quantityCalculator('ld-11', afterDinner),
                },
              ],
            },
          };
          console.log('calculate diet chart hit');
        }
      }

      res.send(dietChart);
    });

    // ------------------------------------------------------
    // Get all exercises
    app.get('/get_exercises', async (req, res) => {
      const cursor = exercisesCollection.find({});
      const exercises = await cursor.toArray();
      res.send(exercises);
    });
  } finally {
  }
}

run();

// Listening
const port = 5000;
app.listen(port, () => console.log('Listening on port ' + port));
