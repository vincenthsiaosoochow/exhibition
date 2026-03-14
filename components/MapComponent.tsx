'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { fetchExhibitions, Exhibition } from '@/lib/data';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Image from 'next/image';

// Fix Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const INITIAL_COORDS: Record<string, [number, number]> = {
  'Paris': [48.8566, 2.3522],
  'London': [51.5074, -0.1278],
  'Cape Town': [-33.9249, 18.4241],
  'New York': [40.7128, -74.0060],
  'Taipei': [25.0330, 121.5654],
};

const geocodeCity = async (city: string): Promise<[number, number] | null> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error('Failed to geocode city:', city, error);
  }
  return null;
};

export default function MapComponent() {
  const { t, language } = useTranslation();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [coordsMap, setCoordsMap] = useState<Record<string, [number, number]>>(INITIAL_COORDS);

  useEffect(() => {
    fetchExhibitions().then(async (data) => {
      setExhibitions(data);
      
      // 动态解析未知城市的坐标
      const newCoords = { ...INITIAL_COORDS };
      let hasNewCoords = false;
      const uniqueCities = Array.from(new Set(data.map((e) => e.location.city)));
      
      for (const city of uniqueCities) {
        if (!newCoords[city]) {
          const coords = await geocodeCity(city);
          if (coords) {
            newCoords[city] = coords;
            hasNewCoords = true;
          }
          // 延迟遵守 OSM Nominatim 的速率限制
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      
      if (hasNewCoords) {
        setCoordsMap(newCoords);
      }
    });
  }, []);

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen w-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {exhibitions.map((ex) => {
          const coords = coordsMap[ex.location.city];
          if (!coords) return null;

          return (
            <Marker key={ex.id} position={coords}>
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <div className="relative w-full h-24 mb-2">
                    <Image src={ex.coverImage} alt={ex.title[language]} fill className="object-cover rounded-lg" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{ex.title[language]}</h3>
                  <p className="text-xs text-neutral-500 mb-2">{ex.venue[language]}</p>
                  <a href={`/exhibition/${ex.id}`} className="text-xs text-blue-600 hover:underline">
                    View Details
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md font-medium text-sm">
        {t('nav.map')} - {exhibitions.length} Exhibitions
      </div>
    </div>
  );
}
