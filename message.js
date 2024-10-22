// models/message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    responded: {
        type: Boolean,
        default: false,
    },
    response: {
        type: String,
        default: '',
    }
});

module.exports = mongoose.model('Message', MessageSchema);
