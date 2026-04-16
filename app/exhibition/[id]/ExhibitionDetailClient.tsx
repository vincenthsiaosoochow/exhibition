'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Exhibition } from '@/lib/data';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  ArrowLeft, Share2, MapPin, Calendar, Clock, Building2,
  Copy, Check, X, Volume2, Pause,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import Link from 'next/link';

interface Props {
  exhibition: Exhibition;
}

/**
 * 客户端交互层 — 只负责需要浏览器 API 的交互：
 *   - 分享 / 复制地址
 *   - 滚动视差动画
 *   - 展品图片弹窗 + 语音 TTS
 *
 * 关键数据（exhibition）由 Server Component (page.tsx) 服务端预取后传入，
 * 浏览器无需发起额外 API 请求，首屏即可看到完整内容。
 */
export default function ExhibitionDetailClient({ exhibition }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();

  const [copied, setCopied] = useState(false);
  // 展品图片弹窗状态
  const [modalImg, setModalImg] = useState<{ url: string; caption: string } | null>(null);
  // 语音朗读状态: idle | playing | paused
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 关闭弹窗时停止语音
  const closeModal = useCallback(() => {
    window.speechSynthesis?.cancel();
    setTtsState('idle');
    setModalImg(null);
  }, []);

  // ESC 键关闭弹窗
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  /**
   * 语音朗读控制逻辑
   * NOTE: Web Speech API 不需要任何第三方服务，支持中文 zh-CN
   */
  const handleTTS = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('您的浏览器不支持语音功能');
      return;
    }
    if (ttsState === 'playing') {
      window.speechSynthesis.pause();
      setTtsState('paused');
      return;
    }
    if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
      return;
    }
    // idle 状态开始新朗读
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 0.95;
    utter.onend = () => setTtsState('idle');
    utter.onerror = () => setTtsState('idle');
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setTtsState('playing');
  }, [ttsState]);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const titleY = useTransform(scrollY, [0, 200], [0, -50]);

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
        await navigator.share({ title, text: description, url: window.location.href });
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exhibition.coverImage}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          // NOTE: 封面图优先加载，不使用 lazy
          loading="eager"
          fetchPriority="high"
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
            {exhibition.venueId ? (
              <Link href={`/venues/${exhibition.venueId}`} className="hover:text-white transition-colors underline underline-offset-4">
                {venue}
              </Link>
            ) : venue}
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
          {exhibition.images.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">{t('details.highlights')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exhibition.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setModalImg(img)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
                    aria-label={`查看展品 ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`${title} highlight ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      // NOTE: 展品图片延迟加载，用户滚动到才加载
                      loading="lazy"
                    />
                    {img.caption && (
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Volume2 className="w-3 h-3" />
                        <span>查看介绍</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {exhibition.artists.length > 0 && (
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
          )}
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
                  {exhibition.venueId && (
                    <Link
                      href={`/venues/${exhibition.venueId}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mb-2"
                    >
                      <Building2 className="w-4 h-4" />
                      {t('details.venue')}
                    </Link>
                  )}
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

      {/* ---- 展品图片介绍弹窗 ---- */}
      {modalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* 弹窗主体 */}
          <div
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5 text-neutral-800" />
            </button>

            {/* 大图 */}
            <div className="w-full aspect-video bg-neutral-100 rounded-t-3xl overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={modalImg.url}
                alt="展品图片"
                className="w-full h-full object-contain"
              />
            </div>

            {/* 介绍文字 + 语音朗读 */}
            {modalImg.caption ? (
              <div className="p-6 space-y-4">
                {/* 顶部工具栏 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900">展品介绍</h3>
                  {/* 语音朗读按钮 */}
                  <button
                    onClick={() => handleTTS(modalImg.caption)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                      ttsState === 'playing'
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : ttsState === 'paused'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                    aria-label={ttsState === 'playing' ? '暂停朗读' : ttsState === 'paused' ? '继续朗读' : '语音朗读'}
                  >
                    {ttsState === 'playing' ? (
                      <><Pause className="w-4 h-4" />朗读中</>
                    ) : ttsState === 'paused' ? (
                      <><Volume2 className="w-4 h-4" />继续</>
                    ) : (
                      <><Volume2 className="w-4 h-4" />语音朗读</>
                    )}
                  </button>
                </div>
                {/* 介绍文字：whitespace-pre-line 保留换行 */}
                <p className="text-neutral-700 leading-relaxed text-base whitespace-pre-line">
                  {modalImg.caption}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-neutral-400 text-sm">
                暂无展品介绍
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
