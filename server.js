const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

app.get('/api/geocode', async (req, res) => {
    const { address } = req.query;
    
    try {
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/geocode/json',
            {
                params: {
                    address: address,
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            }
        );
        
        if (response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            res.json({
                status: 'success',
                location: location
            });
        } else {
            res.json({ status: 'not_found' });
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: 'Geocoding failed' });
    }
});

app.get('/api/search', async (req, res) => {
    const { lat, lng, types } = req.query;
    const searchTypes = types ? types.split(',') : ['cafe', 'library'];

    try {
        console.log(`🔍 Searching for: ${searchTypes.join(', ')} near ${lat}, ${lng}`);
        
        // Make ALL requests at once
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
                        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.types,places.id,places.photos'
                    }
                }
            ).catch(err => {
                console.error(`❌ Error fetching ${type}:`, err.message);
                return { data: { places: [] } };
            })
        );

        const responses = await Promise.all(promises);
        
        const allResults = [];
        responses.forEach(response => {
            if (response.data.places) {
                allResults.push(...response.data.places);
            }
        });
        
        // Remove duplicates
        const uniqueResults = allResults.filter((place, index, self) =>
            index === self.findIndex(p => p.id === place.id)
        );
        
        // Format to match frontend expectations
        const formattedResults = uniqueResults.map(place => ({
            id: place.id,
            place_id: place.id,
            name: place.displayName?.text || 'Unknown',
            rating: place.rating || 0,
            user_ratings_total: place.userRatingCount || 0,
            vicinity: place.formattedAddress || '',
            location: {
                lat: place.location?.latitude,
                lng: place.location?.longitude
            },
            distance: calculateDistance(
                parseFloat(lat), 
                parseFloat(lng), 
                place.location?.latitude, 
                place.location?.longitude
            ),
            photos: place.photos ? place.photos.map(photo => 
                `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}`
            ) : [],
            photo_url: place.photos?.[0] ? 
                `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}` 
                : null,
            geometry: {
                location: {
                    lat: place.location?.latitude,
                    lng: place.location?.longitude
                }
            },
            price_level: place.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' ? 1 :
                         place.priceLevel === 'PRICE_LEVEL_MODERATE' ? 2 :
                         place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 3 :
                         place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE' ? 4 : 2,
            opening_hours: {
                open_now: place.currentOpeningHours?.openNow
            },
            types: place.types || []
        }));
        
        console.log(`✅ Returning ${formattedResults.length} results`);
        
        res.json({
            status: 'success',
            count: formattedResults.length,
            results: formattedResults
        });
        
    } catch (error) {
        console.error('❌ Server Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch study spots',
            details: error.response?.data || error.message
        });
    }
});

app.listen(3000, () => {
    console.log(`
☕ Flow State Server
===================
🚀 Server: http://localhost:3000
🔑 API Key: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Missing'}
    `);
});