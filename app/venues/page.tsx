// NOTE: force-dynamic 防止 next build 阶段调用自身 API（此时服务未启动）
// 该页面改为每次请求时服务端动态渲染
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import type { Metadata } from 'next';
import VenuesClient from './VenuesClient';
import { fetchVenues } from '@/lib/data';

export const metadata: Metadata = {
  title: '场馆 | ARTWALK',
  description: '探索全球艺术场馆',
  openGraph: {
    title: '场馆 | ARTWALK',
    description: '探索全球艺术场馆',
  },
};

/**
 * NOTE: 改为 Server Component 以在服务端直接获取数据，
 * 用户访问时无需等待客户端 JS 加载 + API 往返，首屏即可看到内容。
 */
export default async function VenuesPage() {
  // 构建期获取失败时优雅降级为空列表，运行时正常返回数据
  const venues = await fetchVenues().catch(() => []);
  return (
    <Suspense fallback={null}>
      <VenuesClient initialVenues={venues} />
    </Suspense>
  );
}
