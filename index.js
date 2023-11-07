const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

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
    const userCollection = client.db('FlavorFrontiersManagement').collection('user');
    const purchasedFoodCollection = client.db('FlavorFrontiersManagement').collection('purchasedFoods');
    // Send a ping to confirm a successful connection
    app.get('/', (req, res)=>{
        res.send('Server is Running...');
    })
    
    app.get('/user', async(req, res)=>{
        const email = req.query.email;
        const query = {email: email}
        const result= await userCollection.findOne(query);
        res.send(result);
    })
    app.post('/user', async(req, res)=>{
       const email= req.body.email;
       const query = {email:email}
       const exist = await userCollection.findOne(query);
       if(!exist){
        const result = await userCollection.insertOne(req.body)
        res.send(result)
       }
    })


    app.get('/all-foods-no-condition', async(req, res)=>{
        const result = await foodCollection.find({}).toArray();
        res.send(result);
    })
    app.get('/all-foods', async(req, res)=>{
        const page= parseInt(req.query.page);
        const size = parseInt(9);
        console.log(page, size);
        const category = req.query.category;
        const query = category?{food_category: category}:{};
        const result = await foodCollection.find(query).skip(page*size).limit(size).toArray();
        res.send(result);
      
    })

    app.post('/all-foods', async(req, res)=>{
        const data = req.body;
        const result = await foodCollection.insertOne(data);
        res.send(result);
    })

    app.get('/single-food', async (req, res)=>{
        const id = req.query.id;
        const query = {_id: new ObjectId(id)};
        const result =  await foodCollection.findOne(query);
        res.send(result);
    } )
    
    app.put('/update-food', async(req, res)=>{
        const id = req.query.id;
        const query = {_id: new ObjectId(id)};
        const options = {upsert: true}
        const updatedProduct = req.body;
        const product= {
            $set: {
                food_name: updatedProduct.food_name,
                food_maker: updatedProduct.food_maker,
                food_maker_email: updatedProduct.food_maker_email,
                food_origin: updatedProduct.food_origin,
                food_category: updatedProduct.food_category,
                food_description: updatedProduct.food_description,
                making_processes: updatedProduct.making_processes,
                price_in_dollars: updatedProduct.price_in_dollars,
                food_image: updatedProduct.food_image,
                ingredients: updatedProduct.ingredients,
                quantity: updatedProduct.quantity
            }
        }
        const result = await foodCollection.updateOne(query, product, options);
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

        app.post('/add-to-cart', async(req, res)=>{
        const data = req.body;
        const id = data.food_id;
        const email = data.email;
        const exist = await purchasedFoodCollection.findOne({
            'email':email,
            'food_id': id
        })
        if(exist){
            const {quantity} = exist;
            const query = {
                'email':email,
                'food_id': id}
            const updateDoc = {
                $set:{
                    ...exist,
                    quantity: exist?.quantity+data?.quantity
                }
            }
            const result = await purchasedFoodCollection.updateOne(query, updateDoc, {upsert: true});
        }
        else{
            const result = await purchasedFoodCollection.insertOne(data);
        }
        const food = await foodCollection.findOne({
            '_id': new ObjectId(id)
        })
        const foodUpdateDoc = {
            $set: {
                ...food, 
                quantity: food?.quantity-data?.quantity,
                count: food?.count+ data?.quantity
            }
        }
        const foodResult = await foodCollection.updateOne({
            '_id': new ObjectId(id)
        }, foodUpdateDoc, {upsert:true})

        res.send({message: 'Food Ordered Successfully', success: true}); 

    })
    app.get('/my-cart', async(req, res)=>{
        const email = req.query.email;
        const query = {email:email}
        const result = await purchasedFoodCollection.find(query).toArray();
        console.log(result)
        if(result) res.send(result)
        else res.send({success:false})
    })
    
    app.delete('/delete-purchase', async(req, res)=>{
        const id = req.query.id;
        const query= {_id: new ObjectId(id)}
        const exist = await purchasedFoodCollection.findOne(query)
        const foodExist = await foodCollection.findOne({_id: new ObjectId(exist?.food_id)})
        delete foodExist?._id;
        const updateDoc = {
            $set: {
                ...foodExist,
                quantity: exist?.quantity+foodExist?.quantity
            }
        }
        const foodResult = await foodCollection.updateOne({_id: new ObjectId(exist?.food_id)},updateDoc, {upsert: true})
        const result = await purchasedFoodCollection.deleteOne(query)
        res.send(result);
    })
  } finally {
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

