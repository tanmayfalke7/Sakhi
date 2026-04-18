// In your Node.js server (e.g., server.js or routes/chat.js)
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        // Node.js makes the call to your FastAPI microservice
        const fastApiResponse = await axios.post('http://127.0.0.1:8000/api/v1/chat', {
            message: userMessage,
            symptoms: req.body.symptoms || [] 
        });

        // Send the FastAPI response back to the React frontend
        res.json(fastApiResponse.data);

    } catch (error) {
        console.error("Error communicating with AI Service:", error.message);
        res.status(500).json({ error: "Sakhi is currently taking a quick break!" });
    }
});

module.exports = router;