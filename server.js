// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Message = require('./message');  // MongoDB message schema
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3001',  // React frontend's URL
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/customerMessages', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// API Endpoint to fetch messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
    console.log('Agent connected');

    // Handle agent's response
    socket.on('respondMessage', async ({ messageId, response }) => {
        try {
            const message = await Message.findById(messageId);
            if (message && !message.responded) {
                message.response = response;
                message.responded = true;
                await message.save();
                io.emit('messageResponded', message);  // Notify all connected agents
            }
        } catch (err) {
            console.error('Error responding to message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Agent disconnected');
    });
});

// Function to simulate incoming messages
const simulateIncomingMessages = () => {
    setInterval(async () => {
        const messageData = {
            customerId: `customer${Math.floor(Math.random() * 100)}`,
            message: 'This is a simulated customer message.',
            responded: false, // Initial state
            response: '' // No response initially
        };

        try {
            const newMessage = new Message(messageData);
            await newMessage.save();  // Save message to the database
            io.emit('newMessage', newMessage);  // Emit the new message to all connected clients
            console.log('Simulated incoming message:', messageData);
        } catch (err) {
            console.error('Error saving simulated message:', err);
        }
    }, 5000); // Simulate a new message every 5 seconds
};

// Start simulating incoming messages
simulateIncomingMessages();

// Start the server
server.listen(3000, () => {
    console.log('Server running on port 3000');
});
