'use client';

import { useEffect } from 'react';
import AdminExhibitionForm from '@/components/AdminExhibitionForm';

export default function NewExhibition() {
    useEffect(() => {
        document.title = 'New Exhibition | WORLD ART EXHIBITION';
    }, []);

    return <AdminExhibitionForm isEdit={false} />;
}
