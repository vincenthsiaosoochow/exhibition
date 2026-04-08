'use server';

import { Suspense } from 'react';
import VenuesClient from './VenuesClient';
import { fetchVenues } from '@/lib/data';

/**
 * NOTE: 改为 Server Component 以在服务端直接获取数据，
 * 用户访问时无需等待客户端 JS 加载 + API 往返，首屏即可看到内容。
 */
export default async function VenuesPage() {
  const venues = await fetchVenues();
  return (
    <Suspense fallback={null}>
      <VenuesClient initialVenues={venues} />
    </Suspense>
  );
}
