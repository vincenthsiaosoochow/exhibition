'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Exhibition } from '@/lib/data';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAppStore } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

export default function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const { t, language } = useTranslation();
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });
  const [imageLoaded, setImageLoaded] = useState(false);

  const title = exhibition.title[language];
  const venue = exhibition.venue[language];
  const city = exhibition.location.city;
  const dateFormat = language === 'zh' ? 'yyyy年M月d日' : 'MMM d, yyyy';
  const startDate = format(parseISO(exhibition.startDate), dateFormat);
  const endDate = format(parseISO(exhibition.endDate), dateFormat);

  return (
    <Link href={`/exhibition/${exhibition.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-neutral-100">
        <div ref={ref} className="relative aspect-[4/3] w-full bg-neutral-200 overflow-hidden">
          {inView && (
            <Image
              src={exhibition.coverImage}
              alt={title}
              fill
              className={clsx(
                "object-cover transition-all duration-700 ease-in-out group-hover:scale-105",
                imageLoaded ? "blur-0 opacity-100" : "blur-md opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-neutral-200" />
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className={clsx(
              "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md",
              exhibition.price === 'free' ? "bg-emerald-500/90 text-white" : "bg-fuhung-blue/90 text-white"
            )}>
              {t(`common.${exhibition.price}`)}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-neutral-600 transition-colors">
            {title}
          </h3>
          
          <div className="space-y-1.5 text-sm text-neutral-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{venue}, {city}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{startDate} {language === 'zh' ? '至' : '-'} {endDate}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
