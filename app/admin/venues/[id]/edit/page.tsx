'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchVenueById, Venue } from '@/lib/data';
import AdminVenueForm from '@/components/AdminVenueForm';

export default function EditVenuePage() {
    const params = useParams();
    const id = Number(params.id);
    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchVenueById(id).then((data) => {
            if (!data) setNotFound(true);
            else setVenue(data);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-8 text-neutral-500">加载中...</div>;
    if (notFound || !venue) return <div className="p-8 text-neutral-500">场馆不存在</div>;

    return <AdminVenueForm initialData={venue} isEdit={true} />;
}
