'use client';

import { useMemo, useState } from 'react';
import { Venue } from '@/lib/data';
import { Building2, MapPin, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import clsx from 'clsx';

interface Props {
  initialVenues: Venue[];
}

const CONTINENT_LABELS: Record<string, string> = {
  Asia: '亚洲',
  Europe: '欧洲',
  'North America': '北美洲',
  'South America': '南美洲',
  Africa: '非洲',
  Oceania: '大洋洲',
};

/**
 * 场馆列表交互层：仅负责地区筛选切换等客户端交互。
 * 数据已由上层 Server Component 预取，无需在浏览器端再发 API 请求。
 */
export default function VenuesClient({ initialVenues }: Props) {
  const { t } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState('all');

  const regions = useMemo(() => {
    const continents = Array.from(
      new Set(initialVenues.map((v) => v.continent).filter(Boolean))
    );
    return ['all', ...continents];
  }, [initialVenues]);

  const filteredVenues = useMemo(() => {
    if (selectedRegion === 'all') return initialVenues;
    return initialVenues.filter((v) => v.continent === selectedRegion);
  }, [initialVenues, selectedRegion]);

  return (
    <div className="px-4 py-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('venues.title')}</h1>
        </div>
        <p className="text-neutral-500">{t('venues.subtitle')}</p>
      </motion.div>

      {/* Region Filter */}
      {regions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                selectedRegion === region
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
              )}
            >
              {region === 'all' ? t('venues.allRegions') : (CONTINENT_LABELS[region] ?? region)}
            </button>
          ))}
        </div>
      )}

      {/* Venues Grid */}
      {filteredVenues.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {filteredVenues.map((venue) => (
            <motion.div
              key={venue.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Link href={`/venues/${venue.id}`} className="block group">
                <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  {/* Cover Image */}
                  <div className="aspect-video w-full bg-neutral-100 overflow-hidden">
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
                        <Building2 className="w-16 h-16 text-neutral-200" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-neutral-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {venue.name_zh}
                    </h2>
                    {venue.name_en && (
                      <p className="text-xs text-neutral-400 mb-3">{venue.name_en}</p>
                    )}

                    <div className="space-y-1.5">
                      {(venue.city || venue.country) && (
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                          <span>{[venue.city, venue.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {venue.hours_zh && (
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                          <span className="truncate">{venue.hours_zh}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {venue.continent && (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                          {CONTINENT_LABELS[venue.continent] ?? venue.continent}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 transition-colors ml-auto" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center text-neutral-500 py-20 bg-white rounded-3xl border border-neutral-100">
          <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p>{t('venues.noVenues')}</p>
        </div>
      )}
    </div>
  );
}
