const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

// MongoDB connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database and collection name
const dbName = 'mydatabase'; // Ensure this matches your MongoDB database
const collectionName = 'messages';

async function loadCSVToMongoDB() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log('Connected successfully to MongoDB server');
        
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Read CSV file and insert data into MongoDB
        const results = [];
        fs.createReadStream('questionsdata.csv') // replace with your CSV file path
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Insert all CSV data into the collection
                const insertResult = await collection.insertMany(results);
                console.log(`${insertResult.insertedCount} records inserted into the database.`);
                
                // Close the MongoDB connection
                client.close();
            });
    } catch (err) {
        console.error(err);
    }
}

// Run the CSV loading function
loadCSVToMongoDB();
