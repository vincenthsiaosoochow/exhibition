'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchExhibitionById, Exhibition } from '@/lib/data';
import AdminExhibitionForm from '@/components/AdminExhibitionForm';

export default function EditExhibition() {
    const params = useParams();

    useEffect(() => {
        document.title = 'Edit Exhibition | FUHUNG ART EXHIBITION';
    }, []);

    const [exhibition, setExhibition] = useState<Exhibition | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExhibitionById(params.id as string).then(data => {
            setExhibition(data || null);
            setLoading(false);
        });
    }, [params.id]);

    if (loading) {
        return <div className="p-12 text-center text-neutral-500">加载中...</div>;
    }

    if (!exhibition) {
        return <div className="p-12 text-center text-neutral-500">展览未找到</div>;
    }

    return <AdminExhibitionForm isEdit={true} initialData={exhibition} />;
}
