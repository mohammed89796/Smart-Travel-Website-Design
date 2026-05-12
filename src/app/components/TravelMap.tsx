import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';

export interface Destination {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
  category?: string;
  image?: string;
}

interface TravelMapProps {
  destinations: Destination[];
  onDestinationSelect?: (destination: Destination) => void;
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

const defaultDestinations: Destination[] = [
  {
    id: '1',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    description: 'The City of Light - Home to iconic landmarks like the Eiffel Tower',
    category: 'cultural'
  },
  {
    id: '2',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    description: 'Modern metropolis blending tradition and innovation',
    category: 'urban'
  },
  {
    id: '3',
    name: 'Bali',
    country: 'Indonesia',
    lat: -8.6500,
    lng: 115.2167,
    description: 'Tropical paradise with beaches and cultural temples',
    category: 'beach'
  },
  {
    id: '4',
    name: 'New York',
    country: 'USA',
    lat: 40.7128,
    lng: -74.0060,
    description: 'The city that never sleeps - Urban exploration at its finest',
    category: 'urban'
  },
  {
    id: '5',
    name: 'Barcelona',
    country: 'Spain',
    lat: 41.3851,
    lng: 2.1734,
    description: 'Artistic and architectural hub with unique Gaudí designs',
    category: 'cultural'
  },
  {
    id: '6',
    name: 'Dubai',
    country: 'UAE',
    lat: 25.2048,
    lng: 55.2708,
    description: 'Luxury and modern architecture in the desert',
    category: 'urban'
  },
  {
    id: '7',
    name: 'Switzerland Mountains',
    country: 'Switzerland',
    lat: 46.8182,
    lng: 8.2275,
    description: 'Alpine beauty and adventure activities',
    category: 'mountain'
  },
  {
    id: '8',
    name: 'Cancun',
    country: 'Mexico',
    lat: 21.1619,
    lng: -87.0721,
    description: 'Caribbean beach resort with turquoise waters',
    category: 'beach'
  }
];

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 20,
  lng: 0
};

export const TravelMap: React.FC<TravelMapProps> = ({
  destinations = defaultDestinations,
  onDestinationSelect,
  height = '600px',
  zoom = 3,
  center = defaultCenter
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const [selectedMarker, setSelectedMarker] = useState<Destination | null>(null);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [mapCenter, setMapCenter] = useState(center);

  const handleMarkerClick = useCallback((destination: Destination) => {
    setSelectedMarker(destination);
    setMapCenter({ lat: destination.lat, lng: destination.lng });
    setMapZoom(8);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedMarker(null);
    setMapZoom(zoom);
    setMapCenter(center);
  }, [zoom, center]);

  const handleDestinationSelect = useCallback((destination: Destination) => {
    if (onDestinationSelect) {
      onDestinationSelect(destination);
    }
    handleInfoWindowClose();
  }, [onDestinationSelect, handleInfoWindowClose]);

  if (loadError) {
    return (
      <div style={{ height, width: '100%' }} className="flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-red-600">
          <MapPin className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Google Maps API Key is not configured</p>
          <p className="text-sm mt-1">Please set VITE_GOOGLE_MAPS_API_KEY in your .env file</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height, width: '100%' }} className="flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <Navigation className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true
        }}
      >
        {destinations.map((destination) => (
          <Marker
            key={destination.id}
            position={{ lat: destination.lat, lng: destination.lng }}
            onClick={() => handleMarkerClick(destination)}
            title={destination.name}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-3 max-w-xs">
              {selectedMarker.image && (
                <img
                  src={selectedMarker.image}
                  alt={selectedMarker.name}
                  className="w-full h-40 object-cover rounded mb-2"
                />
              )}
              <div className="font-bold text-lg mb-1">{selectedMarker.name}</div>
              <div className="text-sm text-gray-600 mb-2">{selectedMarker.country}</div>
              {selectedMarker.category && (
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mb-2">
                  {selectedMarker.category}
                </div>
              )}
              <p className="text-sm text-gray-700 mb-3">{selectedMarker.description}</p>
              <button
                onClick={() => handleDestinationSelect(selectedMarker)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm font-medium"
              >
                Explore Destination
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default TravelMap;
