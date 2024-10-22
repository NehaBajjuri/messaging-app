// importMessages.js
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const Message = require('./message');  // MongoDB message schema

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/customerMessages', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Read CSV file and insert messages into MongoDB
const importMessages = () => {
    fs.createReadStream('questionsdata.csv')
        .pipe(csv())
        .on('data', async (row) => {
            try {
                const message = new Message({
                    customerId: row.customerId,
                    message: row.message,
                    responded: false,
                    response: ''
                });
                await message.save();
            } catch (err) {
                console.error('Error saving message:', err);
            }
        })
        .on('end', () => {
            console.log('CSV file successfully processed and messages imported.');
            mongoose.connection.close();
        });
};

importMessages();
