import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000');

const App = () => {
    const [messages, setMessages] = useState([]);
    const [response, setResponse] = useState({}); // Store responses for each message
    const [error, setError] = useState(null); // Error state for feedback

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await axios.get('http://localhost:3000/messages');
                console.log('Messages fetched:', res.data); // Debugging
                setMessages(res.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setError('Failed to load messages. Please try again later.');
            }
        };

        fetchMessages();

        // Handle new messages and message responses
        socket.on('newMessage', (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        socket.on('messageResponded', (updatedMessage) => {
            setMessages((prev) =>
                prev.map((msg) => msg._id === updatedMessage._id ? updatedMessage : msg)
            );
        });

        return () => {
            socket.off('newMessage');
            socket.off('messageResponded');
        };
    }, []);

    // Handle agent's response to a customer message
    const handleResponse = async (messageId, customerId) => {
        const messageResponse = response[messageId]?.trim(); // Get the response for the specific message
        if (messageResponse) {
            socket.emit('respondMessage', { messageId, customerId, response: messageResponse });
            setResponse((prev) => ({ ...prev, [messageId]: '' })); // Clear response for the specific message
        } else {
            setError('Response cannot be empty.'); // Error feedback
        }
    };

    return (
        <div>
            <h1>Agent Portal</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}
            <div>
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <div key={msg._id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
                            <p><strong>Customer ID:</strong> {msg.customerId}</p>
                            <p><strong>Message:</strong> {msg.message}</p>
                            <p><strong>Status:</strong> {msg.responded ? 'Responded' : 'Pending'}</p>
                            {msg.responded && <p><strong>Agent Response:</strong> {msg.response}</p>}
                            
                            {!msg.responded && (
                                <div>
                                    <input
                                        type="text"
                                        value={response[msg._id] || ''} // Use response specific to the message
                                        onChange={(e) => setResponse((prev) => ({ ...prev, [msg._id]: e.target.value }))} // Update response for this message
                                        placeholder="Type your response..."
                                    />
                                    <button onClick={() => handleResponse(msg._id, msg.customerId)}>Send Response</button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No messages yet.</p>
                )}
            </div>
        </div>
    );
};

export default App;
