'use client';

import { useMemo, useState, useCallback } from 'react';
import { Venue } from '@/lib/data';
import { Building2, MapPin, Clock, ChevronRight, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

const ITEMS_PER_PAGE = 10;

/**
 * 场馆列表交互层：
 * - 筛选样式与展览列表页一致（移动端侧滑抽屉 + 桌面侧边栏）
 * - 三级级联筛选：洲 → 国家 → 城市
 * - 分页（每页 10 条），翻页时自动滚回顶部
 */
export default function VenuesClient({ initialVenues }: Props) {
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 计算"已激活的筛选条件数量"，用于在筛选按钮上显示徽标
  const activeFilterCount = [
    selectedRegion !== 'all',
    selectedCountry !== 'all',
    selectedCity !== 'all',
  ].filter(Boolean).length;

  // 从实际数据动态提取洲际列表
  const regions = useMemo(() => {
    const continents = Array.from(
      new Set(initialVenues.map((v) => v.continent).filter(Boolean))
    );
    return ['all', ...continents];
  }, [initialVenues]);

  // 国家列表随洲联动
  const availableCountries = useMemo(() => {
    const source = selectedRegion === 'all'
      ? initialVenues
      : initialVenues.filter((v) => v.continent === selectedRegion);
    const countries = Array.from(new Set(source.map((v) => v.country).filter(Boolean)));
    return ['all', ...countries];
  }, [initialVenues, selectedRegion]);

  // 城市列表随国家联动（国家未选则随洲联动）
  const availableCities = useMemo(() => {
    let source = initialVenues;
    if (selectedCountry !== 'all') {
      source = initialVenues.filter((v) => v.country === selectedCountry);
    } else if (selectedRegion !== 'all') {
      source = initialVenues.filter((v) => v.continent === selectedRegion);
    }
    const cities = Array.from(new Set(source.map((v) => v.city).filter(Boolean)));
    return ['all', ...cities];
  }, [initialVenues, selectedRegion, selectedCountry]);

  const filteredVenues = useMemo(() => {
    return initialVenues.filter((v) => {
      if (selectedRegion !== 'all' && v.continent !== selectedRegion) return false;
      if (selectedCountry !== 'all' && v.country !== selectedCountry) return false;
      if (selectedCity !== 'all' && v.city !== selectedCity) return false;
      return true;
    });
  }, [initialVenues, selectedRegion, selectedCountry, selectedCity]);

  const totalPages = Math.ceil(filteredVenues.length / ITEMS_PER_PAGE);

  const paginatedVenues = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVenues.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVenues, currentPage]);

  // 切换洲时重置下级筛选和分页
  const handleRegionChange = useCallback((region: string) => {
    setSelectedRegion(region);
    setSelectedCountry('all');
    setSelectedCity('all');
    setCurrentPage(1);
  }, []);

  // 切换国家时重置城市筛选和分页
  const handleCountryChange = useCallback((country: string) => {
    setSelectedCountry(country);
    setSelectedCity('all');
    setCurrentPage(1);
  }, []);

  // 切换城市时重置分页
  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    setCurrentPage(1);
  }, []);

  // 翻页并自动滚回顶部
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 清空所有筛选条件
  const resetFilters = useCallback(() => {
    setSelectedRegion('all');
    setSelectedCountry('all');
    setSelectedCity('all');
    setCurrentPage(1);
  }, []);

  return (
    <div className="px-4 py-8 flex flex-col md:flex-row gap-8">

      {/* ---- 移动端顶部：标题 + 筛选按钮 ---- */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('venues.title')}</h1>
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="relative flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-full font-medium hover:bg-neutral-200 transition-colors"
        >
          <Filter className="w-4 h-4" />
          筛选
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ---- 筛选面板（移动端侧滑抽屉 / 桌面侧边栏）---- */}
      <AnimatePresence>
        {(isFilterOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={clsx(
              'fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-white p-6 overflow-y-auto border-r border-neutral-200',
              'md:static md:w-64 md:border-none md:p-0 md:bg-transparent md:block md:translate-x-0',
              !isFilterOpen && 'hidden md:block'
            )}
          >
            {/* 移动端面板头部 */}
            <div className="flex justify-between items-center mb-8 md:hidden">
              <h2 className="text-xl font-bold">筛选</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 桌面端标题 */}
            <div className="hidden md:block mb-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{t('venues.title')}</h1>
              </div>
              <p className="text-neutral-500 ml-[52px]">{t('venues.subtitle')}</p>
            </div>

            <div className="space-y-8">
              {/* ---- 地区筛选（三级联动）---- */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">地区</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      清除筛选
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  {/* 洲 */}
                  <div className="flex flex-wrap gap-2">
                    {regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => {
                          handleRegionChange(region);
                          // 移动端选完后关闭面板
                          if (window.innerWidth < 768) setIsFilterOpen(false);
                        }}
                        className={clsx(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                          selectedRegion === region
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                      >
                        {region === 'all' ? '全部地区' : (CONTINENT_LABELS[region] ?? region)}
                      </button>
                    ))}
                  </div>

                  {/* 国家（多于 1 个时显示） */}
                  {availableCountries.length > 2 && (
                    <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-neutral-100">
                      {availableCountries.map((country) => (
                        <button
                          key={country}
                          onClick={() => handleCountryChange(country)}
                          className={clsx(
                            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                            selectedCountry === country
                              ? 'bg-indigo-500 text-white'
                              : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-200'
                          )}
                        >
                          {country === 'all' ? '全部国家' : country}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 城市（多于 1 个时显示） */}
                  {availableCities.length > 2 && (
                    <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-neutral-100">
                      {availableCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => handleCityChange(city)}
                          className={clsx(
                            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                            selectedCity === city
                              ? 'bg-indigo-400 text-white'
                              : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-200'
                          )}
                        >
                          {city === 'all' ? '全部城市' : city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ---- 主内容区 ---- */}
      <div className="flex-1 min-w-0">
        {/* 桌面端结果统计 */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-500">
            共 <span className="font-semibold text-neutral-900">{filteredVenues.length}</span> 个场馆
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="ml-2 text-indigo-600 hover:text-indigo-800 font-medium">
                清除筛选
              </button>
            )}
          </p>
          <p className="text-sm text-neutral-400">
            第 {currentPage} / {Math.max(totalPages, 1)} 页
          </p>
        </div>

        {/* Venues Grid */}
        {paginatedVenues.length > 0 ? (
          <>
            <motion.div
              key={`page-${currentPage}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {paginatedVenues.map((venue) => (
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

            {/* ---- 分页控制 ---- */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 pb-8">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-5 py-2 rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  上一页
                </button>
                <div className="text-sm font-medium text-neutral-600 min-w-[80px] text-center">
                  第 {currentPage} / {totalPages} 页
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2 rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-neutral-500 py-20 bg-white rounded-3xl border border-neutral-100">
            <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p>{t('venues.noVenues')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
