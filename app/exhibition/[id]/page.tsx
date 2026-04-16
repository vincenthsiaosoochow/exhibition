// NOTE: force-dynamic 防止构建期调用自身 API（服务尚未启动）
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { fetchExhibitionById, incrementViewCount } from '@/lib/data';
import ExhibitionDetailClient from './ExhibitionDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Server Component — 服务端直接获取展览数据并渲染 HTML。
 * 用户打开页面时内容已完整，无需等待浏览器端 JS 加载 + API 往返。
 *
 * NOTE: 与 layout.tsx 的 generateMetadata 共用同一请求，Next.js 会
 * 自动 deduplicate (fetch 去重)，保证 DB 只查询一次。
 */
export default async function ExhibitionPage({ params }: Props) {
  const { id } = await params;
  const exhibition = await fetchExhibitionById(id);

  if (!exhibition) notFound();

  // NOTE: 浏览量统计异步执行，不阻塞页面渲染
  incrementViewCount(id).catch(() => {});

  return <ExhibitionDetailClient exhibition={exhibition} />;
}
