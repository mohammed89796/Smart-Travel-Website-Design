# Google Maps Integration Setup Guide

## Overview
The Smart Travel Website now includes an interactive Google Maps component that displays popular travel destinations around the world. Users can click on destination markers to see details and explore locations.

## Getting Started

### 1. Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
4. Create an API key:
   - Go to Credentials
   - Click "Create Credentials" → "API Key"
   - Copy your API key

### 2. Configure Your Environment

Add your Google Maps API key to your `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key.

### 3. Maps Component Features

The TravelMap component includes:

- **Interactive Map Display**: Shows destinations with markers
- **Destination Markers**: Click on any marker to view destination details
- **Info Windows**: Popup cards showing:
  - Destination name and country
  - Category/classification
  - Description
  - Destination image
  - "Explore Destination" button
- **Zoom Control**: Auto-zoom when selecting a destination
- **Custom Controls**: Street view, map type, and fullscreen controls

### 4. Default Destinations

The map displays 8 major travel destinations by default:

1. **Paris, France** - The City of Light
2. **Tokyo, Japan** - Modern metropolis
3. **Bali, Indonesia** - Tropical paradise
4. **New York, USA** - The city that never sleeps
5. **Barcelona, Spain** - Artistic hub
6. **Dubai, UAE** - Luxury and modernity
7. **Switzerland** - Alpine beauty
8. **Cancun, Mexico** - Caribbean resort

### 5. How to Use the Map

#### For Users:
1. Navigate to the home page
2. Scroll to the "Explore Destinations on Map" section
3. Click on any destination marker
4. View destination details in the popup
5. Click "Explore Destination" to view more information

#### For Developers:
```jsx
import { TravelMap, Destination } from './components/TravelMap';

// Basic usage
<TravelMap 
  height="600px"
  zoom={3}
  onDestinationSelect={(destination) => {
    // Handle destination selection
    console.log('Selected:', destination);
  }}
/>

// With custom destinations
const customDestinations: Destination[] = [
  {
    id: '1',
    name: 'Cairo',
    country: 'Egypt',
    lat: 30.0444,
    lng: 31.2357,
    description: 'Ancient wonders and vibrant culture',
    category: 'historical'
  }
];

<TravelMap 
  destinations={customDestinations}
  height="600px"
  zoom={5}
/>
```

## Troubleshooting

### Issue: "Google Maps API Key is not configured"

**Solution**: 
- Verify your API key is added to `.env` file
- Use `VITE_GOOGLE_MAPS_API_KEY` (exact spelling required)
- Make sure the key has Maps JavaScript API enabled

### Issue: Map not loading with "No API key"

**Solution**:
- Restart your development server:
  ```bash
  npm run dev
  ```
- Clear browser cache
- Check browser console for errors

### Issue: API Quota Exceeded

**Solution**:
- Check your API usage in Google Cloud Console
- Upgrade your API quota limits
- Consider using API restrictions

### Issue: CORS or Network Errors

**Solution**:
- Verify HTTP referrer restrictions in Google Cloud Console
- Add `localhost:5173` (or your dev port) to allowed referrers
- Check API key restrictions

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Restrict API key** to specific domains:
   - Add HTTP referrer restrictions in Google Cloud Console
   - Limit APIs that can be accessed with this key
4. **Monitor usage** regularly to detect suspicious activity
5. **Rotate keys** periodically
6. **Use separate keys** for development and production

## API Key Restrictions (Recommended)

In Google Cloud Console, restrict your API key to:

1. **Application restrictions**:
   - HTTP referrers (web)
   - Add your domain: `yourdomain.com`
   - For development: `localhost:5173`

2. **API restrictions**:
   - Maps JavaScript API
   - Places API

## Pricing Information

Google Maps API has the following free tier:
- **$200 free monthly credit** (auto-renewable)
- First 28 days of using the Maps API are free
- After first month, billing applies unless you stay under free tier

Estimated costs for typical usage:
- Map loads: $7 per 1,000 loads
- Markers/Places: $7 per 1,000 requests

## Advanced Customization

### Add Custom Destinations Dynamically

```jsx
const [destinations, setDestinations] = useState<Destination[]>([...]);

const addDestination = (dest: Destination) => {
  setDestinations(prev => [...prev, dest]);
};
```

### Filter Destinations by Category

```jsx
const getDestinationsByCategory = (category: string) => {
  return destinations.filter(d => d.category === category);
};
```

## Next Steps

1. ✅ Add API key to `.env` file
2. ✅ Start your development server: `npm run dev`
3. ✅ Navigate to home page and see the map
4. ✅ Click on markers to test functionality
5. ✅ Deploy with secure API key handling

## Support

For issues or questions:
1. Check Google Maps API documentation: https://developers.google.com/maps
2. Review error messages in browser console
3. Test with Google Maps examples: https://developers.google.com/maps/documentation/javascript/examples
