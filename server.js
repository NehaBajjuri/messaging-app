const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create an Express application
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/messagingApp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected successfully!'))
    .catch(err => console.error('Database connection error:', err));

// Define your Message schema and model
const messageSchema = new mongoose.Schema({
    customerId: { type: String, required: true }, // Set required if you want this field to be mandatory
    message: { type: String, required: true }, // Set required if you want this field to be mandatory
    responded: { type: Boolean, default: false },
    response: { type: String, default: '' } // Default to empty string
});

const Message = mongoose.model('Message', messageSchema);

// Load messages from the database
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        console.log('Fetched messages:', messages); 
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Socket.IO setup
io.on('connection', (socket) => {
    console.log('A user connected');

    // Emit all messages to the newly connected client
    Message.find().then(messages => {
        socket.emit('allMessages', messages);
    });

    // Handle new message responses
    socket.on('respondMessage', async ({ messageId, customerId, response }) => {
        try {
            await Message.findByIdAndUpdate(messageId, 
                { responded: true, response: response },
                { new: true }
            );
            // Emit the updated message back to clients
            const updatedMessage = await Message.findById(messageId);
            if (!updatedMessage) {
                console.error('Message not found');
                return;
            }
            io.emit('messageResponded', updatedMessage);
        } catch (error) {
            console.error('Error updating message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(3001, () => {
    console.log('Server running on port 3001');
});
