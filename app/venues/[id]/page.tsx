// NOTE: force-dynamic 防止 next build 阶段调用自身 API（此时服务未启动）
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { fetchVenueById, fetchExhibitions } from '@/lib/data';
import VenueDetailClient from './VenueDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * NOTE: Server Component — 场馆详情和该场馆展览数据在服务端并行获取，
 * 浏览器收到页面时数据已完整，无首屏 API 等待。
 */
export default async function VenuePage({ params }: Props) {
  const { id } = await params;
  const venueId = Number(id);

  if (!venueId || isNaN(venueId)) notFound();

  // 并行获取场馆信息和展览列表
  const [venue, exhibitions] = await Promise.all([
    fetchVenueById(venueId),
    fetchExhibitions({ venueId }),
  ]);

  if (!venue) notFound();

  return <VenueDetailClient venue={venue} exhibitions={exhibitions} />;
}
