'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { fetchExhibitions, Exhibition } from '@/lib/data';
import ExhibitionCard from '@/components/ExhibitionCard';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { useAppStore } from '@/lib/store';

// NOTE: 洲际英文键对应中文显示，与后台选择项一致
const CONTINENT_LABELS: Record<string, string> = {
  Asia: '亚洲',
  Europe: '欧洲',
  'North America': '北美洲',
  'South America': '南美洲',
  Africa: '非洲',
  Oceania: '大洋洲',
};

export default function Discover() {
  const { t, language } = useTranslation();

  useEffect(() => {
    document.title = '展览 | ARTWALK';
  }, []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const [allExhibitions, setAllExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  // 从 API 加载所有展览数据，筛选由前端完成
  useEffect(() => {
    fetchExhibitions().then((data) => {
      setAllExhibitions(data);
      setLoading(false);
    });
  }, []);

  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredExhibitions = useMemo(() => {
    return allExhibitions.filter((ex) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          ex.title[language].toLowerCase().includes(query) ||
          ex.venue[language].toLowerCase().includes(query) ||
          ex.artists.some(a => a.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Region
      if (selectedRegion !== 'all' && ex.location.continent !== selectedRegion) return false;

      // Country
      if (selectedCountry !== 'all' && ex.location.country !== selectedCountry) return false;

      // City
      if (selectedCity !== 'all' && ex.location.city !== selectedCity) return false;

      // Status
      if (selectedStatus !== 'all' && ex.status !== selectedStatus) return false;

      // Price
      if (selectedPrice !== 'all' && ex.price !== selectedPrice) return false;

      return true;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [allExhibitions, searchQuery, selectedRegion, selectedCountry, selectedCity, selectedStatus, selectedPrice, language]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRegion, selectedCountry, selectedCity, selectedStatus, selectedPrice, language]);

  const totalPages = Math.ceil(filteredExhibitions.length / ITEMS_PER_PAGE);
  const paginatedExhibitions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExhibitions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExhibitions, currentPage]);

  // NOTE: 使用数据库实际有的洲际，动态构建筛选列表
  const regions = useMemo(() => {
    const continents = Array.from(new Set(allExhibitions.map(ex => ex.location.continent).filter(Boolean)));
    return ['all', ...continents];
  }, [allExhibitions]);

  const availableCountries = useMemo(() => {
    let countries = allExhibitions.map(ex => ex.location.country);
    if (selectedRegion !== 'all') {
      countries = allExhibitions.filter(ex => ex.location.continent === selectedRegion).map(ex => ex.location.country);
    }
    return ['all', ...Array.from(new Set(countries))];
  }, [allExhibitions, selectedRegion]);

  const availableCities = useMemo(() => {
    let cities = allExhibitions.map(ex => ex.location.city);
    if (selectedCountry !== 'all') {
      cities = allExhibitions.filter(ex => ex.location.country === selectedCountry).map(ex => ex.location.city);
    } else if (selectedRegion !== 'all') {
      cities = allExhibitions.filter(ex => ex.location.continent === selectedRegion).map(ex => ex.location.city);
    }
    return ['all', ...Array.from(new Set(cities))];
  }, [allExhibitions, selectedRegion, selectedCountry]);

  const statuses = ['all', 'recent', 'ending', 'longTerm'];
  const prices = ['all', 'free', 'paid'];

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedCountry('all');
    setSelectedCity('all');
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedCity('all');
  };

  return (
    <div className="px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{t('discover.title')}</h1>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-full font-medium"
        >
          <Filter className="w-4 h-4" />
          {t('discover.filter')}
        </button>
      </div>

      {/* Filter Sidebar */}
      <AnimatePresence>
        {(isFilterOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={clsx(
              "fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-white p-6 overflow-y-auto border-r border-neutral-200 md:static md:w-64 md:border-none md:p-0 md:bg-transparent md:block md:translate-x-0",
              !isFilterOpen && "hidden md:block"
            )}
          >
            <div className="flex justify-between items-center mb-8 md:hidden">
              <h2 className="text-xl font-bold">{t('discover.filter')}</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-neutral-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Region Filter */}
              <div>
                <h3 className="font-semibold mb-3">{t('discover.region')}</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    {regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => handleRegionChange(region)}
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                          selectedRegion === region ? "bg-fuhung-blue text-white shadow-md shadow-fuhung-blue/20" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        )}
                      >
                        {region === 'all' ? t('discover.all') : (CONTINENT_LABELS[region] ?? region)}
                      </button>
                    ))}
                  </div>

                  {availableCountries.length > 1 && (
                    <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-neutral-100">
                      {availableCountries.map((country) => (
                        <button
                          key={country}
                          onClick={() => handleCountryChange(country)}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                            selectedCountry === country ? "bg-fuhung-blue/80 text-white" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-200"
                          )}
                        >
                          {country === 'all' ? t('discover.all') : country}
                        </button>
                      ))}
                    </div>
                  )}

                  {availableCities.length > 1 && (
                    <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-neutral-100">
                      {availableCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                            selectedCity === city ? "bg-fuhung-blue/60 text-white" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-200"
                          )}
                        >
                          {city === 'all' ? t('discover.all') : city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h3 className="font-semibold mb-3">{t('discover.status')}</h3>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        selectedStatus === status ? "bg-fuhung-blue text-white shadow-md shadow-fuhung-blue/20" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {status === 'all' ? t('discover.all') : t(`discover.${status}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-semibold mb-3">{t('discover.price')}</h3>
                <div className="flex flex-wrap gap-2">
                  {prices.map((price) => (
                    <button
                      key={price}
                      onClick={() => setSelectedPrice(price)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        selectedPrice === price ? "bg-fuhung-blue text-white shadow-md shadow-fuhung-blue/20" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {price === 'all' ? t('discover.all') : t(`common.${price}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6 hidden md:block">{t('discover.title')}</h1>

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
        ) : paginatedExhibitions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedExhibitions.map((exhibition) => (
                <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 pb-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  {language === 'zh' ? '上一页' : 'Previous'}
                </button>
                <div className="text-sm font-medium text-neutral-600">
                  {language === 'zh' ? `第 ${currentPage} / ${totalPages} 页` : `Page ${currentPage} of ${totalPages}`}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  {language === 'zh' ? '下一页' : 'Next'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-neutral-500 py-20 bg-white rounded-3xl border border-neutral-100">
            {t('common.noResults')}
          </div>
        )}
      </div>
    </div>
  );
}
