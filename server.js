const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/branchMessages', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('Connection error', err);
});

// Define Message Schema
const messageSchema = new mongoose.Schema({
  customerName: String,
  message: String,
  agentResponse: String,
  priority: { type: String, default: 'normal' },
  claimedBy: String,
  isResolved: { type: Boolean, default: false },
});

const Message = mongoose.model('Message', messageSchema);

// Routes
// POST: Receive new customer message
app.post('/api/messages', async (req, res) => {
  const { customerName, message } = req.body;
  const newMessage = new Message({ customerName, message });
  await newMessage.save();
  res.status(201).json(newMessage);
});

// GET: Retrieve all messages
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find();
  res.status(200).json(messages);
});

// PUT: Respond to a message
app.put('/api/messages/:id/respond', async (req, res) => {
  const { id } = req.params;
  const { agentResponse, agentName } = req.body;
  const updatedMessage = await Message.findByIdAndUpdate(
    id,
    { agentResponse, claimedBy: agentName, isResolved: true },
    { new: true }
  );
  res.status(200).json(updatedMessage);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
