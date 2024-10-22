// App.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000');

const App = () => {
    const [messages, setMessages] = useState([]);
    const [response, setResponse] = useState('');

    // Fetch messages from the backend API on component load
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await axios.get('/api/messages');
                setMessages(res.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchMessages();

        // Listen for new messages via WebSocket
        socket.on('newMessage', (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        // Listen for message responses via WebSocket
        socket.on('messageResponded', (updatedMessage) => {
            setMessages((prev) => 
                prev.map((msg) => msg._id === updatedMessage._id ? updatedMessage : msg)
            );
        });

        // Clean up event listeners on component unmount
        return () => {
            socket.off('newMessage');
            socket.off('messageResponded');
        };
    }, []);

    // Handle agent's response to a customer message
    const handleResponse = async (messageId, customerId) => {
        if (response.trim()) {
            socket.emit('respondMessage', { messageId, customerId, response });
            setResponse('');  // Clear response input after submission
        }
    };

    return (
        <div>
            <h1>Agent Portal</h1>
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
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
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
