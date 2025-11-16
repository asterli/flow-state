const express = require('express');
const axios = require('axios');
require('dotenv').config()

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/api/search', async (req, res) => {
    const { lat, lng } = req.query;

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
                location: `${lat},${lng}`,
                radius: 2000,
                type: 'cafe',
                keyword: 'coffee',
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch coffee shops' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000')
});