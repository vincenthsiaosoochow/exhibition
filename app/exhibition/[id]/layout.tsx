import { fetchExhibitionById } from '@/lib/data';
import type { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>
    children: React.ReactNode
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    // NOTE: Next.js 会自动对相同 URL 的 fetch 去重（Request Deduplication），
    // 此处与 page.tsx 的 fetchExhibitionById 共用同一次网络请求，不会双倍查询 DB。
    const exhibition = await fetchExhibitionById(id);

    if (!exhibition) {
        return {
            title: 'Exhibition Not Found'
        };
    }

    const titleZh = exhibition.title.zh;
    // NOTE: 只显示中文标题，避免重复
    const title = titleZh;
    const description = exhibition.description.zh || exhibition.description.en || 'Discover global art exhibitions at ARTWALK.';

    // Metadata with Open Graph for social media sharing
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: exhibition.coverImage,
                    width: 1200,
                    height: 630,
                    alt: titleZh,
                }
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [exhibition.coverImage],
        }
    };
}

export default function ExhibitionLayout({ children }: Props) {
    return <>{children}</>;
}
