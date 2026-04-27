'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { fetchExhibitions, fetchVenues, Exhibition, Venue } from '@/lib/data';
import ExhibitionCard from '@/components/ExhibitionCard';
import { motion } from 'motion/react';
import { ChevronRight, Building2, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { t, language } = useTranslation();

  useEffect(() => {
    document.title = '首页 | ARTWALK';
  }, []);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchExhibitions(), fetchVenues()]).then(([exData, venueData]) => {
      setExhibitions(exData);
      setVenues(venueData.slice(0, 3)); // 只取3个作为热门场馆
      setLoading(false);
    });
  }, []);

  const filteredExhibitions = exhibitions.filter(ex => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ex.title[language].toLowerCase().includes(query) ||
      ex.venue[language].toLowerCase().includes(query) ||
      ex.artists.some(a => a.toLowerCase().includes(query))
    );
  });

  // NOTE: 最新展览 — 按 startDate 降序取最近3个，与 status 无关
  const latestExhibitions = [...filteredExhibitions]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);
  const endingSoon = filteredExhibitions.filter(e => e.status === 'ending').slice(0, 3);

  if (searchQuery) {
    return (
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">搜索结果 &quot;{searchQuery}&quot;</h2>
        {filteredExhibitions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExhibitions.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        ) : (
          <div className="text-center text-neutral-500 py-12">
            {t('common.noResults')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 px-4 py-8">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white min-h-[400px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
        <Image
          src="https://picsum.photos/1200/600?random=100"
          alt="Hero"
          fill
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-20 max-w-xl p-8 md:p-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          >
            看艺术，看世界
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-300 mb-8"
          >
            发现全球正在进行中的艺术展
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-neutral-100 transition-colors shadow-lg"
            >
              浏览全部展览
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 animate-pulse">
                <div className="aspect-[4/3] w-full bg-neutral-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && (
        <>
          {/* Latest Exhibitions Section */}
          {latestExhibitions.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">最新展览</h2>
                <Link href="/discover" className="text-sm font-medium text-neutral-500 hover:text-black flex items-center">
                  {t('discover.all')} <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestExhibitions.map((exhibition) => (
                  <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
                ))}
              </div>
            </section>
          )}

          {/* Ending Soon Section (Horizontal Scroll on Mobile) */}
          {endingSoon.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">{t('home.endingSoon')}</h2>
              </div>
              <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 snap-x">
                {endingSoon.map((exhibition) => (
                  <div key={exhibition.id} className="min-w-[280px] sm:min-w-0 snap-start">
                    <ExhibitionCard exhibition={exhibition} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hot Venues Section */}
          {venues.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">热门场馆</h2>
                <Link href="/venues" className="text-sm font-medium text-neutral-500 hover:text-black flex items-center">
                  浏览更多 <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue) => (
                  <Link key={venue.id} href={`/venues/${venue.id}`} className="block group">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                      {/* Cover Image */}
                      <div className="aspect-video w-full bg-neutral-100 overflow-hidden relative">
                        {venue.cover_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={venue.cover_image}
                            alt={venue.name_zh}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-neutral-200" />
                          </div>
                        )}
                        {venue.continent && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-neutral-800">
                            {venue.continent === 'Europe' ? '欧洲' : venue.continent === 'Asia' ? '亚洲' : venue.continent}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-neutral-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {venue.name_zh}
                        </h3>
                        {venue.name_en && (
                          <p className="text-xs text-neutral-400 mb-3 line-clamp-1">{venue.name_en}</p>
                        )}
                        <div className="space-y-1.5 mt-2">
                          {(venue.city || venue.country) && (
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                              <span className="truncate">{[venue.city, venue.country].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                          {venue.hours_zh && (
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                              <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                              <span className="truncate">{venue.hours_zh}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
