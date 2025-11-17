const { useState } = React;

// API URL
const API_BASE_URL = 'https://flow-state-yvuz.onrender.com/api';

// Header
function Header() {
    return (
        <header className="header">
            <h1 className="logo">flow state</h1>
            {/* <p className="tagline">find your next study spot!</p> */}
        </header>
    );
}

// Search Bar Component
function SearchBar({ onSearch, loading }) {
    const [location, setLocation] = useState('current');
    const [manualAddress, setManualAddress] = useState('');

    const handleGetLocation = () => {
        console.log('🔍 Getting location...');
        
        if (location === 'manual') {
            if (!manualAddress.trim()) {
                alert('Please enter a location');
                return;
            }
            // Geocode the address
            geocodeAddress(manualAddress);
            return;
        }
        
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ Location received:', position.coords);
                const { latitude, longitude } = position.coords;
                onSearch(latitude, longitude);
            },
            (error) => {
                console.error('❌ Geolocation error:', error);
                
                let message = 'Unable to get your location. ';
                if (error.code === 1) {
                    message += 'Please allow location access in your browser settings.';
                } else if (error.code === 2) {
                    message += 'Location unavailable. Please check your device settings.';
                } else if (error.code === 3) {
                    message += 'Request timed out. Please try again.';
                }
                alert(message);
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: 60000
            }
        );
    };

    const geocodeAddress = async (address) => {
        try {
            const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
            const data = await response.json();
            
            if (data.status === 'success' && data.location) {
                onSearch(data.location.lat, data.location.lng);
            } else {
                alert('Could not find that location. Please try a different address.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('Error finding location. Please try again.');
        }
    };

    return (
        <div className="search-section">
            <h2 className="hero-title">discover study spaces near you</h2>
            
            <div className="location-selector">
                <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    className="location-dropdown"
                    disabled={loading}
                >
                    <option value="current">📍 use my current location</option>
                    <option value="manual">📝 enter a different location</option>
                </select>
                
                {location === 'manual' && (
                    <input 
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="Enter city, address, or ZIP code..."
                        className="manual-input"
                        disabled={loading}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleGetLocation();
                            }
                        }}
                    />
                )}
                
                <button 
                    onClick={handleGetLocation} 
                    className="search-btn"
                    disabled={loading}
                >
                    {loading ? 'Searching...' : 'Find Study Spots'}
                </button>
            </div>
        </div>
    );
}

// Filters Component
function Filters({ onFilterChange, activeFilter }) {
    const filters = [
        { id: 'all', label: 'all', emoji: '' },
        { id: 'cafe', label: 'cafe', emoji: '☕' },
        { id: 'library', label: 'library', emoji: '📚' }
    ];

    return (
        <div className="filters">
            {filters.map((filter) => (
                <button
                    key={filter.id}
                    className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                    onClick={() => onFilterChange(filter.id)}
                >
                    {filter.label} {filter.emoji}
                </button>
            ))}
        </div>
    );
}

// NEW: Sort Controls Component
function SortControls({ sortBy, onSortChange }) {
    return (
        <div style={{ 
            display: 'flex', 
            gap: '10px', 
            padding: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
        }}>
            <button 
                onClick={() => onSortChange('rating')}
                className={`filter-btn ${sortBy === 'rating' ? 'active' : ''}`}
            >
                highest rated ⭐
            </button>
            <button 
                onClick={() => onSortChange('price')}
                className={`filter-btn ${sortBy === 'price' ? 'active' : ''}`}
            >
                lowest price 💰
            </button>
            <button 
                onClick={() => onSortChange('default')}
                className={`filter-btn ${sortBy === 'default' ? 'active' : ''}`}
            >
                📍 most relevant
            </button>
        </div>
    );
}

// spot card component
function SpotCard({ spot }) {
    const rating = spot.rating || 0;
    const stars = '★'.repeat(Math.round(rating));
    const emptyStars = '☆'.repeat(5 - Math.round(rating));
    
    const distance = spot.distance ? (spot.distance / 1609).toFixed(1) : 'N/A';
    const priceLevel = spot.price_level ? '$'.repeat(spot.price_level) : '$$';
    const isOpen = spot.opening_hours && spot.opening_hours.open_now;
    
    const reviewCount = spot.user_ratings_total || spot.reviews_count || 0;
    
    // Handle coordinates
    let lat, lng;
    if (spot.geometry && spot.geometry.location) {
        lat = spot.geometry.location.lat;
        lng = spot.geometry.location.lng;
    } else if (spot.lat && spot.lng) {
        lat = spot.lat;
        lng = spot.lng;
    }

    return (
        <div className="spot-card">
            <div className="spot-image">
                {spot.photo_url ? (
                    <img src={spot.photo_url} alt={spot.name} />
                ) : spot.photos && spot.photos.length > 0 ? (
                    <img src={spot.photos[0]} alt={spot.name} />
                ) : (
                    <div className="placeholder">
                        {spot.types && spot.types.includes('library') ? '📚' : '☕'}
                    </div>
                )}
            </div>
            
            <div className="spot-content">
                <h4 className="spot-name">{spot.name}</h4>
                
                <div className="spot-rating">
                    <span className="stars">{stars}{emptyStars}</span>
                    <span>{rating.toFixed(1)} ({reviewCount} reviews)</span>
                </div>
                
                <div className="spot-details">
                    <span>💵 {priceLevel}</span>
                    <span>📍 {distance} mi</span>
                    {isOpen && <span className="badge">open now</span>}
                </div>
                
                {spot.vicinity && (
                    <p style={{ fontSize: '0.9rem', color: '#8B9D83', marginBottom: '1rem' }}>
                        {spot.vicinity}
                    </p>
                )}
                
                <div className="spot-actions">
                    {lat && lng && (
                        <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        >
                        directions
                        </a>
                    )}

                    <a
                        href={spot.url || `https://www.google.com/maps/place/?q=place_id:${spot.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                    >
                        view details
                    </a>
                </div>
            </div>
        </div>
    );
}

// Results Grid Component
// Fixed Results Grid Component
function ResultsGrid({ spots, loading }) {
    // IMPORTANT: Check loading FIRST
    if (loading) {
        return (
            <div className="results-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Finding perfect study spots near you...</p>
                </div>
            </div>
        );
    }

    // Then check if no results
    if (!spots || spots.length === 0) {
        return (
            <div className="results-container">
                <p className="no-results">
                    Click "Find Study Spots" to discover places near you
                </p>
            </div>
        );
    }

    // Finally show results
    return (
        <div className="results-container">
            <h3 className="section-title">top spots near you</h3>
            <div className="results-grid">
                {spots.map((spot, index) => (
                    <SpotCard key={spot.place_id || spot.id || index} spot={spot} />
                ))}
            </div>
        </div>
    );
}

// main app
// main app - OPTIMIZED VERSION (No API calls when sorting)
function App() {
    const [spots, setSpots] = useState([]);
    const [allSpots, setAllSpots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortBy, setSortBy] = useState(null); // Start with no sorting

    // Sort function - pure function that doesn't cause side effects
    const sortSpots = (spotsToSort, sortType) => {
        // If no sorting selected, return original order
        if (!sortType) {
            return spotsToSort;
        }
        
        const sorted = [...spotsToSort];
        
        if (sortType === 'rating') {
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            console.log('📊 Sorted by rating');
        } else if (sortType === 'price') {
            sorted.sort((a, b) => (a.price_level || 2) - (b.price_level || 2));
            console.log('📊 Sorted by price (lowest first)');
        }
        
        return sorted;
    };

    // Search for study spots - ONLY CALLED ONCE, fetches ALL types
    const searchStudySpots = async (latitude, longitude) => {
        console.log('🔍 Search started for:', latitude, longitude);
        setLoading(true);
        setSpots([]);
        setSortBy(null); // Reset sorting on new search
        
        try {
            // ALWAYS fetch both cafes and libraries
            const types = 'cafe,library';
            
            const url = `${API_BASE_URL}/search?lat=${latitude}&lng=${longitude}&types=${types}`;
            console.log('🔍 Fetching:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Raw API response:', data);
            
            let results = [];
            if (Array.isArray(data)) {
                results = data;
            } else if (data.results) {
                results = data.results;
            } else if (data.places) {
                results = data.places;
            } else if (data.data) {
                results = data.data;
            }
            
            console.log('✅ Processed results:', results.length, 'places');
            
            // Store ALL results
            setAllSpots(results);
            setSpots(results); // Show all results initially
            
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Unable to find study spots.\n\n' + error.message);
        } finally {
            console.log('✅ Search complete, setting loading to false');
            setLoading(false);
        }
    };

    // Filter spots - NO API CALL
    const filterSpots = (filterId) => {
        console.log('🔍 Changing filter to:', filterId);
        setActiveFilter(filterId);
        
        let filtered = [];
        
        if (filterId === 'all') {
            filtered = allSpots;
        } else if (filterId === 'cafe') {
            filtered = allSpots.filter((spot) => {
                if (!spot.types) return false;
                return spot.types.includes('cafe') || 
                       spot.types.includes('coffee_shop') ||
                       spot.type === 'cafe';
            });
        } else if (filterId === 'library') {
            filtered = allSpots.filter((spot) => {
                if (!spot.types) return false;
                return spot.types.includes('library') || spot.type === 'library';
            });
        }
        
        console.log('📊 Filtered results:', filtered.length, 'places');
        
        // Apply current sorting to filtered results
        const sorted = sortSpots(filtered, sortBy);
        setSpots(sorted);
    };

    // Handle sort change - NO API CALL, just re-sort current spots
    const handleSortChange = (newSortBy) => {
        console.log('🔄 Changing sort to:', newSortBy);
        setSortBy(newSortBy);
        
        // Get current filtered spots based on active filter
        let currentSpots = [];
        if (activeFilter === 'all') {
            currentSpots = allSpots;
        } else if (activeFilter === 'cafe') {
            currentSpots = allSpots.filter((spot) => {
                if (!spot.types) return false;
                return spot.types.includes('cafe') || 
                       spot.types.includes('coffee_shop') ||
                       spot.type === 'cafe';
            });
        } else if (activeFilter === 'library') {
            currentSpots = allSpots.filter((spot) => {
                if (!spot.types) return false;
                return spot.types.includes('library') || spot.type === 'library';
            });
        }
        
        // Apply new sorting
        const sorted = sortSpots(currentSpots, newSortBy);
        setSpots(sorted);
    };

    return (
        <div className="App">
            <Header />
            <SearchBar onSearch={searchStudySpots} loading={loading} />
            <Filters onFilterChange={filterSpots} activeFilter={activeFilter} />
            <SortControls sortBy={sortBy} onSortChange={handleSortChange} />
            <ResultsGrid spots={spots} loading={loading} />
        </div>
    );
}

// render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

console.log('✅ Flow State loaded successfully!');
console.log('🔗 API URL:', API_BASE_URL);