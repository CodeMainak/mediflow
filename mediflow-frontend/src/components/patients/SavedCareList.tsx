import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { getSavedPlaces, deleteSavedPlace } from '../../services/placesService';
import { typeLabel } from '../../utils/findNearbyCare';
import { Bookmark, Star, Navigation, X } from 'lucide-react';
import { toast } from 'sonner';

interface SavedPlace {
  _id: string;
  name: string;
  type: string;
  rating?: number;
  userRatingsTotal?: number;
  mapsUrl: string;
}

export const SavedCareList: React.FC = () => {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedPlaces()
      .then((res) => setPlaces(res.data.places || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id: string, name: string) => {
    try {
      await deleteSavedPlace(id);
      setPlaces((prev) => prev.filter((p) => p._id !== id));
      toast.success(`Removed ${name}`);
    } catch {
      toast.error('Could not remove this place right now.');
    }
  };

  if (loading || places.length === 0) return null;

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Bookmark className="h-5 w-5 text-green-600" />
          Saved Care
        </CardTitle>
        <CardDescription>Real places you've bookmarked from the symptom checker.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {places.map((p) => (
          <div key={p._id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <a href={p.mapsUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-0 group">
              <div className="text-sm font-medium text-gray-900 truncate group-hover:text-green-700">{p.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span>{typeLabel(p.type)}</span>
                {typeof p.rating === 'number' && (
                  <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {p.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </a>
            <div className="flex items-center gap-1 shrink-0">
              <a href={p.mapsUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md text-gray-300 hover:text-green-600 hover:bg-green-50 transition-colors">
                <Navigation className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => handleRemove(p._id, p.name)}
                className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label={`Remove ${p.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
