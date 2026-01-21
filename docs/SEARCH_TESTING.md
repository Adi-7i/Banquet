# Search Module

Request examples with optional redis url:  
```bash
# Without Redis (optional - search works without it)
export REDIS_URL=redis://localhost:6379

# Or skip Redis entirely - system will run without caching
```

---

## Search Banquets

### Basic Text Search
```bash
curl -X POST http://localhost:3000/api/v1/search/banquets \
  -H "Content-Type: application/json" \
  -d '{
    "text": "wedding",
    "page": 1,
    "limit": 10
  }' | jq
```

### City + Capacity Filter
```bash
curl -X POST http://localhost:3000/api/v1/search/banquets \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Mumbai",
    "minCapacity": 200,
    "maxCapacity": 500,
    "page": 1,
    "limit": 10
  }' | jq
```

### Price Range
```bash
curl -X POST http://localhost:3000/api/v1/search/banquets \
  -H "Content-Type: application/json" \
  -d '{
    "minPrice": 800,
    "maxPrice": 1500,
    "sortBy": "price_low"
  }' | jq
```

### Location-based (Geospatial)
```bash
curl -X POST http://localhost:3000/api/v1/search/banquets \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.0760,
    "longitude": 72.8777,
    "radiusKm": 10,
    "sortBy": "distance"
  }' | jq
```

### Multi-criteria Search
```bash
curl -X POST http://localhost:3000/api/v1/search/banquets \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Mumbai",
    "minCapacity": 300,
    "minPrice": 1000,
    "maxPrice": 2000,
    "amenities": ["parking", "ac"],
    "sortBy": "rating",
    "page": 1,
    "limit": 20
  }' | jq
```

---

## Get Search Facets
```bash
curl -X GET http://localhost:3000/api/v1/search/facets | jq
```

## Get Autocomplete Suggestions
```bash
curl -X GET "http://localhost:3000/api/v1/search/suggestions?q=wed&limit=5" | jq
```

## Get Popular Searches
```bash
curl -X GET "http://localhost:3000/api/v1/search/popular?limit=10" | jq
```

## Get Trending Locations
```bash
curl -X GET "http://localhost:3000/api/v1/search/trending/locations?limit=10" | jq
```

## Get Search Stats
```bash
# Requires authentication
curl -X GET http://localhost:3000/api/v1/search/stats \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

---

## Expected Response Format

```json
{
  "data": [
    {
      "id": "...",
      "name": "Royal Palace Banquet",
      "description": "...",
      "city": "Mumbai",
      "address": "...",
      "capacity": 800,
      "pricing": { "perPlate": 1200, "minimumGuests": 150 },
      "amenities": { "parking": true, "ac": true, ... },
      "images": [],
      "rating": 4.5,
      "distance": 2.3,  // Only if location search
      "createdAt": "..."
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "metadata": {
    "queryTimeMs": 45,
    "cached": false,
    "appliedFilters": { "city": "Mumbai", "minCapacity": 200 }
  }
}
```
