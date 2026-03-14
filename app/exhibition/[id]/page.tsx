'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchExhibitionById, Exhibition } from '@/lib/data';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, Share2, MapPin, Calendar, Clock, Train, Copy, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';


export default function ExhibitionDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t, language } = useTranslation();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const titleY = useTransform(scrollY, [0, 200], [0, -50]);

  useEffect(() => {
    fetchExhibitionById(id).then((data) => {
      if (!data) {
        setNotFound(true);
      } else {
        setExhibition(data);
        document.title = `${data.title.zh} | ${data.title.en} | WORLD ART EXHIBITION`;
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="relative bg-white min-h-screen pb-24 md:pb-8 animate-pulse">
        <div className="h-[50vh] min-h-[400px] w-full bg-neutral-200" />
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-2/3" />
          <div className="h-4 bg-neutral-200 rounded w-full" />
          <div className="h-4 bg-neutral-200 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (notFound || !exhibition) {
    return <div className="p-8 text-center">Exhibition not found</div>;
  }

  const title = exhibition.title[language];
  const venue = exhibition.venue[language];
  const description = exhibition.description[language];
  const address = exhibition.address[language];
  const hours = exhibition.hours[language];
  const bookingUrl = exhibition.bookingUrl;
  
  const dateFormat = language === 'zh' ? 'yyyy年M月d日' : 'MMM d, yyyy';
  const startDateStr = format(parseISO(exhibition.startDate), dateFormat);
  const endDateStr = format(parseISO(exhibition.endDate), dateFormat);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-white min-h-screen pb-24 md:pb-8">
      {/* Sticky Header */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 h-14 flex items-center justify-between px-4 md:ml-64"
      >
        <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-600 hover:text-black">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-sm truncate max-w-[200px]">{title}</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 text-neutral-600 hover:text-black">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-neutral-900">
        <Image
          src={exhibition.coverImage}
          alt={title}
          fill
          className="object-cover opacity-80"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top actions (visible before scroll) */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-40 md:hidden">
          <button onClick={() => router.back()} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <motion.div
          style={{ y: titleY }}
          className="absolute bottom-0 left-0 right-0 p-6 md:p-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className={clsx(
              "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md",
              exhibition.price === 'free' ? "bg-emerald-500/90 text-white" : "bg-white/20 text-white"
            )}>
              {t(`common.${exhibition.price}`)}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-white/20 backdrop-blur-md text-white">
              {t(`discover.${exhibition.status}`)}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
            {title}
          </h1>
          <p className="text-lg text-neutral-300 font-medium">
            {venue}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">

        {/* Main Column */}
        <div className="md:col-span-2 space-y-12">
          {/* About */}
          <section>
            <h2 className="text-2xl font-bold mb-6">{t('details.about')}</h2>
            <p className="text-lg text-neutral-600 leading-relaxed">
              {description}
            </p>
          </section>

          {/* Highlights / Images */}
          <section>
            <h2 className="text-2xl font-bold mb-6">{t('details.highlights')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exhibition.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100">
                  <Image
                    src={img}
                    alt={`${title} highlight ${idx + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Artists */}
          <section>
            <h2 className="text-2xl font-bold mb-6">{t('details.artists')}</h2>
            <div className="flex flex-wrap gap-3">
              {exhibition.artists.map((artist) => (
                <span key={artist} className="px-4 py-2 bg-neutral-100 rounded-full text-sm font-medium text-neutral-800">
                  {artist}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 sticky top-24">
            <h3 className="text-xl font-bold mb-6">{t('details.practicalInfo')}</h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <Calendar className="w-6 h-6 text-neutral-400 shrink-0" />
                <div>
                  <p className="font-medium text-neutral-900">{startDateStr}</p>
                  <p className="text-sm text-neutral-500">{language === 'zh' ? '至' : 'to'} {endDateStr}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="w-6 h-6 text-neutral-400 shrink-0" />
                <div>
                  <p className="font-medium text-neutral-900">{hours}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-neutral-400 shrink-0" />
                <div>
                  <p className="font-medium text-neutral-900 mb-2">{address}</p>
                  <button
                    onClick={handleCopyAddress}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t('common.copied') : t('common.copyAddress')}
                  </button>
                </div>
              </div>


            </div>
          </div>

          {bookingUrl && (
            <button
              onClick={() => window.open(bookingUrl, '_blank')}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {t('details.bookNow')}
            </button>
          )}
        </div>

      </div>

      {/* 版权声明 */}
      <div className="max-w-2xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5">
          <p className="text-xs text-neutral-500 leading-relaxed">
            本网站为免费艺术展览资讯分享平台，仅用于文化艺术交流，非商业用途。网站展示的展览图文、影像等内容，版权均归艺术家、展览主办方及相关权利人所有。若内容侵犯您的合法权益，请及时联系，我们将立即核实处理。
          </p>
        </div>
      </div>

    </div>
  );
}
