const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/search', async (req, res) => {
    const { lat, lng, types } = req.query;

    const searchTypes = types ? types.split(',') : ['cafe', 'library'];

    try {
        const allResults = [];
        
        for (const type of searchTypes) {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
                params: {
                    location: `${lat},${lng}`,
                    radius: 3000,
                    type: type,
                    keyword: type === 'cafe' ? 'wifi study' : '',
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            });
          
            if (response.data.results) {
                allResults.push(...response.data.results);
            }
        }
        
        const uniqueResults = allResults.filter((place, index, self) =>
            index === self.findIndex(p => p.place_id === place.place_id)
        );
        
        const formattedResults = uniqueResults.map(place => ({
            id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            vicinity: place.vicinity,
            location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            },
            price_level: place.price_level,
            open_now: place.opening_hours?.open_now,
            types: place.types // Shows if it's cafe, library, etc.
        }));
        
        res.json({
            status: 'success',
            count: formattedResults.length,
            results: formattedResults
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch study spots' });
    }
});

app.listen(3000, () => {
    console.log('☕ Server running on http://localhost:3000');
});