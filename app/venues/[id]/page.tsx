'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchVenueById, fetchExhibitions, Venue, Exhibition } from '@/lib/data';
import ExhibitionCard from '@/components/ExhibitionCard';
import { ArrowLeft, MapPin, Clock, Globe, Building2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function VenueDetail() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetchVenueById(id),
      fetchExhibitions({ venueId: id }),
    ]).then(([venueData, exhibitionData]) => {
      if (!venueData) {
        setNotFound(true);
      } else {
        setVenue(venueData);
        document.title = `${venueData.name_zh} | ARTWALK`;
      }
      setExhibitions(exhibitionData);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse min-h-screen">
        <div className="h-64 bg-neutral-200 w-full" />
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/2" />
          <div className="h-4 bg-neutral-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !venue) {
    return (
      <div className="p-8 text-center text-neutral-500">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
        <p>场馆不存在</p>
      </div>
    );
  }

  return (
    <div className="relative bg-white min-h-screen pb-16">
      {/* Hero */}
      <div className="relative h-64 md:h-80 w-full bg-neutral-900 overflow-hidden">
        {venue.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={venue.cover_image}
            alt={venue.name_zh}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-24 h-24 text-neutral-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{venue.name_zh}</h1>
          {venue.name_en && (
            <p className="text-neutral-300 text-lg">{venue.name_en}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Main: Exhibitions */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-6">
            展览 <span className="text-neutral-400 text-lg font-normal">({exhibitions.length})</span>
          </h2>

          {exhibitions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {exhibitions.map((ex) => (
                <ExhibitionCard key={ex.id} exhibition={ex} />
              ))}
            </div>
          ) : (
            <div className="text-center text-neutral-500 py-16 bg-neutral-50 rounded-2xl border border-neutral-100">
              <p>该场馆暂无展览</p>
            </div>
          )}
        </div>

        {/* Sidebar: Info */}
        <div className="space-y-6">
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 sticky top-24">
            <h3 className="text-lg font-bold mb-5">场馆信息</h3>

            <div className="space-y-4">
              {(venue.city || venue.country) && (
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {[venue.city, venue.country].filter(Boolean).join(', ')}
                    </p>
                    {venue.address_zh && (
                      <p className="text-sm text-neutral-500 mt-0.5">{venue.address_zh}</p>
                    )}
                  </div>
                </div>
              )}

              {venue.hours_zh && (
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-600">{venue.hours_zh}</p>
                </div>
              )}

              {venue.website && (
                <div className="flex gap-3">
                  <Globe className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    官网 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {venue.description_zh && (
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-sm text-neutral-600 leading-relaxed">{venue.description_zh}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
