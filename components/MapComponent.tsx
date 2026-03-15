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

const geocodeCity = async (city: string): Promise<{ coords: [number, number] | null, fromCache: boolean }> => {
  try {
    const cached = localStorage.getItem(`geocode_${city}`);
    if (cached) {
      return { coords: JSON.parse(cached), fromCache: true };
    }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      localStorage.setItem(`geocode_${city}`, JSON.stringify(coords));
      return { coords, fromCache: false };
    }
  } catch (error) {
    console.error('Failed to geocode city:', city, error);
  }
  return { coords: null, fromCache: false };
};

export default function MapComponent() {
  const { t, language } = useTranslation();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [coordsMap, setCoordsMap] = useState<Record<string, [number, number]>>(INITIAL_COORDS);

  useEffect(() => {
    let isMounted = true;
    fetchExhibitions().then(async (data) => {
      if (!isMounted) return;
      setExhibitions(data);
      
      const uniqueCities = Array.from(new Set(data.map((e) => e.location.city)));
      
      for (const city of uniqueCities) {
        if (!isMounted) break;
        // 如果初始坐标表已有，直接跳过
        if (INITIAL_COORDS[city]) continue;
        
        // 增量获取，防止一次性拿不到所有坐标导致用户什么都看不到或者等很久
        const result = await geocodeCity(city);
        if (result.coords) {
          setCoordsMap(prev => ({ ...prev, [city]: result.coords! }));
        }
        
        // 只有产生真实外部请求时，才需要遵守 Nominatim 速率限制（1请求/秒）进行休眠，避免遭阻断
        if (!result.fromCache) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    });

    return () => { isMounted = false; };
  }, []);

  const exhibitionsByCity = exhibitions.reduce((acc, ex) => {
    const city = ex.location.city;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(ex);
    return acc;
  }, {} as Record<string, Exhibition[]>);

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
        {Object.entries(exhibitionsByCity).map(([city, cityExhibitions]) => {
          const coords = coordsMap[city];
          if (!coords) return null;

          return (
            <Marker key={city} position={coords}>
              <Popup>
                <div className="p-1 w-[220px] max-h-[350px] overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                  <div className="sticky top-0 bg-white/95 backdrop-blur z-10 pb-2 border-b font-bold text-sm flex justify-between items-center">
                    <span>{city}</span>
                    <span className="bg-neutral-100 px-2 py-0.5 rounded-full text-xs font-medium text-neutral-600">
                      {cityExhibitions.length}
                    </span>
                  </div>
                  {cityExhibitions.map((ex) => (
                    <div key={ex.id} className="pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
                      <div className="relative w-full h-28 mb-2">
                        <Image src={ex.coverImage} alt={ex.title[language]} fill className="object-cover rounded-lg shadow-sm" referrerPolicy="no-referrer" />
                      </div>
                      <h3 className="font-bold text-sm mb-1 leading-tight">{ex.title[language]}</h3>
                      <p className="text-xs text-neutral-500 mb-2 truncate">{ex.venue[language]}</p>
                      <a href={`/exhibition/${ex.id}`} className="inline-block text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        View Details →
                      </a>
                    </div>
                  ))}
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
