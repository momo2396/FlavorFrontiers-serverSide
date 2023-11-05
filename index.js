const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()
console.log(process.env.DB_USER);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kxy8ozq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)


    const foodCollection = client.db('FlavorFrontiersManagement').collection('foods');
    // Send a ping to confirm a successful connection


    app.get('/', (req, res)=>{
        res.send('Server is Running...');
    })

    app.get('/all-foods', async(req, res)=>{
        const category = req.query.category;
        const query = category?{food_category: category}:{};
        const result = await foodCollection.find(query).toArray();
        res.send(result);
    })

    app.post('/all-foods', async(req, res)=>{
        const data = req.body;
        const result = await foodCollection.insertOne(data);
        res.send(result);
    })

    app.delete('/all-foods', async(req, res)=>{
        const result = await foodCollection.deleteOne({_id: new ObjectId(req.query?.id)})
        res.send(result);
    })

    app.get('/get-categories', async(req, res)=>{
        const foods = await foodCollection.find().toArray();
        const categories = [];
        foods.forEach((f)=>{
            const cat = f.food_category;
            if(!categories.includes(cat)) categories.push(cat);
        })
       res.send(categories);
    })
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, async()=>{
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    console.log(`Server is running on port ${port}`);
})


// ggggggggggggggggg