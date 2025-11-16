const { useState } = React;

// API URL
const API_BASE_URL = '/api';

// Header
function Header() {
    return (
        <header className="header">
            <h1 className="logo">flow state</h1>
            <p className="tagline">find your next stydy spot!</p>
        </header>
    );
}

// Search Bar Component
function SearchBar({ onSearch, loading }) {
    const [location, setLocation] = useState('current');

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    onSearch(latitude, longitude);
                },
                (error) => {
                    alert('Unable to get your location. Please check permissions.');
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    return (
        <div className="search-section">
            <h2 className="hero-title">discover peaceful study spaces near you</h2>
            
            <div className="location-selector">
                <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    className="location-dropdown"
                    disabled={loading}
                >
                    <option value="current">Use my current location 📍</option>
                    <option value="manual">Enter a different location...</option>
                </select>
                
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

// Resutls Grid Component
function ResultsGrid({ spots, loading }) {
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

    if (!spots || spots.length === 0) {
        return (
            <div className="results-container">
                <p className="no-results">
                    Click "Find Study Spots" to discover places near you
                </p>
            </div>
        );
    }

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
function App() {
    const [spots, setSpots] = useState([]);
    const [allSpots, setAllSpots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    // Search for study spots
    const searchStudySpots = async (latitude, longitude) => {
        setLoading(true);
        
        try {
            // Build types parameter
            let types = '';
            if (activeFilter === 'cafe') {
                types = 'cafe';
            } else if (activeFilter === 'library') {
                types = 'library';
            } else {
                types = 'cafe,library';
            }
            
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
            
            // Handle different response formats
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
            if (results.length > 0) {
                console.log('📍 First place:', results[0]);
            }
            
            setAllSpots(results);
            setSpots(results);
            
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Unable to find study spots.\n\n' + error.message + '\n\nMake sure backend is running!');
        } finally {
            setLoading(false);
        }
    };

    // Filter spots
    const filterSpots = (filterId) => {
        console.log('🔍 Changing filter to:', filterId);
        setActiveFilter(filterId);
        
        if (filterId === 'all') {
            setSpots(allSpots);
            console.log('📊 Showing all:', allSpots.length, 'places');
            return;
        }
        
        let filtered = [];
        
        if (filterId === 'cafe') {
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
        
        console.log(' Filtered results:', filtered.length, 'places');
        setSpots(filtered);
    };

    return (
        <div className="App">
            <Header />
            <SearchBar onSearch={searchStudySpots} loading={loading} />
            <Filters onFilterChange={filterSpots} activeFilter={activeFilter} />
            <ResultsGrid spots={spots} loading={loading} />
        </div>
    );
}

// render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

console.log(' Flow State loaded successfully!');
console.log(' API URL:', API_BASE_URL);
