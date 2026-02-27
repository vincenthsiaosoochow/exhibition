'use client';

import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n/useTranslation';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading map...</div>
});

export default function MapPage() {
  return <MapComponent />;
}
