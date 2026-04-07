'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createVenue, updateVenue, getAdminToken } from '@/lib/admin-api';
import { Venue } from '@/lib/data';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface AdminVenueFormProps {
    initialData?: Venue;
    isEdit?: boolean;
}

export default function AdminVenueForm({ initialData, isEdit }: AdminVenueFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name_zh: initialData?.name_zh || '',
        name_en: initialData?.name_en || '',
        continent: initialData?.continent || 'Asia',
        country: initialData?.country || '',
        city: initialData?.city || '',
        address_zh: initialData?.address_zh || '',
        address_en: initialData?.address_en || '',
        hours_zh: initialData?.hours_zh || '',
        hours_en: initialData?.hours_en || '',
        cover_image: initialData?.cover_image || '',
        description_zh: initialData?.description_zh || '',
        description_en: initialData?.description_en || '',
        website: initialData?.website || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    /**
     * 上传封面图：POST /api/upload 返回 base64 URL
     */
    const uploadFile = async (file: File): Promise<string> => {
        const token = getAdminToken();
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || '上传失败');
        }
        const data = await res.json();
        return data.url as string;
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        try {
            const url = await uploadFile(file);
            handleChange('cover_image', url);
        } catch (err) {
            alert(err instanceof Error ? err.message : '封面上传失败');
        } finally {
            setUploadingCover(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit && initialData) {
                await updateVenue(initialData.id, formData);
            } else {
                await createVenue(formData);
            }
            router.push('/admin/venues');
            router.refresh();
        } catch (err) {
            const msg = err instanceof Error ? err.message : '未知错误';
            alert(`${isEdit ? '更新' : '创建'}失败：${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/venues" className="p-2 -ml-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">{isEdit ? '编辑场馆' : '新建场馆'}</h1>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {loading ? '保存中...' : '保存'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* 基本信息 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">基本信息</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">场馆名称（中文）*</label>
                            <input
                                type="text"
                                required
                                value={formData.name_zh}
                                onChange={e => handleChange('name_zh', e.target.value)}
                                placeholder="如：上海当代艺术博物馆"
                                className="w-full p-3 border border-neutral-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">场馆名称（英文）</label>
                            <input
                                type="text"
                                value={formData.name_en}
                                onChange={e => handleChange('name_en', e.target.value)}
                                placeholder="如：Museum of Contemporary Art Shanghai"
                                className="w-full p-3 border border-neutral-200 rounded-xl"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">场馆简介</label>
                            <textarea
                                rows={3}
                                value={formData.description_zh}
                                onChange={e => handleChange('description_zh', e.target.value)}
                                placeholder="请输入场馆简介..."
                                className="w-full p-3 border border-neutral-200 rounded-xl resize-none"
                            />
                        </div>

                        {/* 封面图 */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">封面图片</label>
                            <div className="flex gap-4 items-start">
                                {formData.cover_image ? (
                                    <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.cover_image} alt="封面预览" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-40 h-28 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center shrink-0">
                                        <ImageIcon className="w-8 h-8 text-neutral-300" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => coverInputRef.current?.click()}
                                        disabled={uploadingCover}
                                        className="flex items-center gap-2 px-4 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {uploadingCover ? '上传中...' : '点击上传图片'}
                                    </button>
                                    <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                                    <input
                                        type="text"
                                        value={formData.cover_image}
                                        onChange={e => handleChange('cover_image', e.target.value)}
                                        placeholder="或直接输入图片 URL"
                                        className="w-full p-2.5 border border-neutral-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 位置信息 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">位置信息</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">大洲</label>
                            <select value={formData.continent} onChange={e => handleChange('continent', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl bg-white text-sm">
                                <option value="Asia">亚洲</option>
                                <option value="Europe">欧洲</option>
                                <option value="North America">北美洲</option>
                                <option value="South America">南美洲</option>
                                <option value="Africa">非洲</option>
                                <option value="Oceania">大洋洲</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">国家</label>
                            <input type="text" value={formData.country} onChange={e => handleChange('country', e.target.value)} placeholder="如：中国" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">城市</label>
                            <input type="text" value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="如：上海" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">详细地址（中文）</label>
                            <input type="text" value={formData.address_zh} onChange={e => handleChange('address_zh', e.target.value)} placeholder="如：上海市黄浦区花园港路200号" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">详细地址（英文）</label>
                            <input type="text" value={formData.address_en} onChange={e => handleChange('address_en', e.target.value)} placeholder="如：200 Huayuangang Rd, Shanghai" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                    </div>
                </section>

                {/* 运营信息 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">运营信息</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">开放时间（中文）</label>
                            <input type="text" value={formData.hours_zh} onChange={e => handleChange('hours_zh', e.target.value)} placeholder="如：周二至周日 10:00-18:00，周一闭馆" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">开放时间（英文）</label>
                            <input type="text" value={formData.hours_en} onChange={e => handleChange('hours_en', e.target.value)} placeholder="如：Tue-Sun 10:00-18:00, Closed Mon" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">官网</label>
                            <input type="text" value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="如：https://example-museum.com" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                    </div>
                </section>
            </div>
        </form>
    );
}
