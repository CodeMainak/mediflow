import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { findNearbyCare, genericMapsSearchUrl, typeLabel, NearbyPlace } from '../../utils/findNearbyCare';
import { MapPin, Loader2, Navigation } from 'lucide-react';

interface NearbyCareFinderProps {
  category: 'emergency' | 'general';
  label?: string;
}

export const NearbyCareFinder: React.FC<NearbyCareFinderProps> = ({ category, label }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setStatus('loading');
    setError('');
    try {
      const results = await findNearbyCare(category);
      setPlaces(results);
      setStatus(results.length > 0 ? 'done' : 'error');
      if (results.length === 0) setError('No results found nearby. You can search manually instead.');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. You can search manually instead.');
      setStatus('error');
    }
  };

  if (status === 'idle') {
    return (
      <Button
        variant={category === 'emergency' ? 'default' : 'outline'}
        size="sm"
        onClick={handleClick}
        className={category === 'emergency' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-gray-200 text-gray-700 hover:bg-white'}
      >
        <MapPin className="mr-1.5 h-3.5 w-3.5" />
        {label || 'Find real care near you'}
      </Button>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding real places near you...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertDescription className="text-amber-800 text-xs">
          {error}{' '}
          <a href={genericMapsSearchUrl(category)} target="_blank" rel="noreferrer" className="underline font-medium">
            Search on Google Maps
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Real places near you, via OpenStreetMap:</p>
      {places.map((p) => (
        <a
          key={p.name + p.mapsUrl}
          href={p.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors group"
        >
          <div>
            <div className="text-sm font-medium text-gray-900">{p.name}</div>
            <div className="text-xs text-gray-500">{typeLabel(p.type)} · {p.distanceKm.toFixed(1)} km away</div>
          </div>
          <Navigation className="h-4 w-4 text-gray-300 group-hover:text-green-600 transition-colors" />
        </a>
      ))}
    </div>
  );
};
