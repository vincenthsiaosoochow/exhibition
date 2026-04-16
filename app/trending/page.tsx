'use client';

import { useState, useEffect } from 'react';
import { fetchExhibitions, Exhibition } from '@/lib/data';
import ExhibitionCard from '@/components/ExhibitionCard';
import { Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Trending() {
  const { t } = useTranslation();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '热门 | ARTWALK';
  }, []);

  useEffect(() => {
    // NOTE: 通过 sort_by=views 参数获取按浏览量降序排列的展览
    fetchExhibitions({ sortBy: 'views' }).then((data) => {
      setExhibitions(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 py-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('trending.title')}</h1>
        </div>
        <p className="text-neutral-500 ml-13 pl-1">
          {t('trending.subtitle')}
        </p>
      </motion.div>

      {/* Rankings */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 animate-pulse">
              <div className="aspect-[4/3] w-full bg-neutral-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : exhibitions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.slice(0, 20).map((exhibition, index) => (
            <div key={exhibition.id} className="relative">
              {/* 排名徽章 */}
              <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                index === 1 ? 'bg-neutral-300 text-neutral-700' :
                index === 2 ? 'bg-orange-400 text-orange-900' :
                'bg-black/60 text-white'
              }`}>
                {index + 1}
              </div>
              <ExhibitionCard exhibition={exhibition} />
              {/* 浏览量显示 */}
              {exhibition.viewCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 px-2 text-xs text-neutral-500">
                  <Flame className="w-3 h-3 text-orange-400" />
                  {exhibition.viewCount.toLocaleString()} 次浏览
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-neutral-500 py-20 bg-white rounded-3xl border border-neutral-100">
          <Flame className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p>{t('trending.empty')}</p>
        </div>
      )}
    </div>
  );
}
