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
        // Make ALL requests at once instead of one-by-one
        const promises = searchTypes.map(type => 
            axios.post(
                'https://places.googleapis.com/v1/places:searchNearby',
                {
                    includedTypes: [type === 'cafe' ? 'coffee_shop' : type],
                    maxResultCount: 20,
                    locationRestriction: {
                        circle: {
                            center: {
                                latitude: parseFloat(lat),
                                longitude: parseFloat(lng)
                            },
                            radius: 3000.0
                        }
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.types,places.id'
                    }
                }
            ).catch(err => {
                console.error(`Error fetching ${type}:`, err.message);
                return { data: { places: [] } };
            })
        );

        // Wait for all requests to finish together
        const responses = await Promise.all(promises);
        
        const allResults = [];
        responses.forEach(response => {
            if (response.data.places) {
                allResults.push(...response.data.places);
            }
        });
        
        const uniqueResults = allResults.filter((place, index, self) =>
            index === self.findIndex(p => p.id === place.id)
        );
        
        const formattedResults = uniqueResults.map(place => ({
            id: place.id,
            name: place.displayName?.text || 'Unknown',
            rating: place.rating || 0,
            user_ratings_total: place.userRatingCount || 0,
            vicinity: place.formattedAddress || '',
            location: {
                lat: place.location?.latitude,
                lng: place.location?.longitude
            },
            price_level: place.priceLevel,
            open_now: place.currentOpeningHours?.openNow,
            types: place.types
        }));
        
        res.json({
            status: 'success',
            count: formattedResults.length,
            results: formattedResults
        });
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch study spots',
            details: error.response?.data || error.message
        });
    }
});

app.listen(3000, () => {
    console.log('☕ Server running on http://localhost:3000');
});