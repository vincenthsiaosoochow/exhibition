import { fetchExhibitionById } from '@/lib/data';
import type { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>
    children: React.ReactNode
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const exhibition = await fetchExhibitionById(id);

    if (!exhibition) {
        return {
            title: 'Exhibition Not Found | WORLD ART EXHIBITION'
        };
    }

    const titleEn = exhibition.title.en;
    const titleZh = exhibition.title.zh;
    const title = `${titleZh} | ${titleEn}`;
    const description = exhibition.description.zh || exhibition.description.en || 'Discover global art exhibitions at FUHUNG.';

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
