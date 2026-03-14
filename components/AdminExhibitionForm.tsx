'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createExhibition, updateExhibition, getAdminToken } from '@/lib/admin-api';
import { Exhibition } from '@/lib/data';
import { ArrowLeft, Save, Plus, Trash2, Upload, Image as ImageIcon, Info } from 'lucide-react';
import Link from 'next/link';

interface AdminExhibitionFormProps {
    initialData?: Exhibition;
    isEdit?: boolean;
}

/**
 * 根据开始日期和结束日期自动计算展览状态
 * - longTerm：展期超过 365 天
 * - ending：距离结束日期不足 30 天
 * - recent：其他
 */
function calcStatus(startDate: string, endDate: string): 'recent' | 'ending' | 'longTerm' {
    if (!startDate || !endDate) return 'recent';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const daysLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays > 365) return 'longTerm';
    if (daysLeft <= 30) return 'ending';
    return 'recent';
}

export default function AdminExhibitionForm({ initialData, isEdit }: AdminExhibitionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingImage, setUploadingImage] = useState<number | null>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        // NOTE: 中文字段为主要输入，提交时自动将中文值复制给英文字段（API 兼容性）
        title_zh: initialData?.title?.zh || '',
        venue_zh: initialData?.venue?.zh || '',
        continent: initialData?.location?.continent || 'Europe',
        country: initialData?.location?.country || '',
        city: initialData?.location?.city || '',
        start_date: initialData?.startDate?.split('T')[0] || '',
        end_date: initialData?.endDate?.split('T')[0] || '',
        cover_image: initialData?.coverImage || '',
        price: initialData?.price || 'paid',
        description_zh: initialData?.description?.zh || '',
        address_zh: initialData?.address?.zh || '',
        hours_zh: initialData?.hours?.zh || '',
        booking_url: initialData?.bookingUrl || '',
        artists: initialData?.artists || [] as string[],
        images: initialData?.images || [] as string[],
    });

    const handleChange = (field: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 上传图片通用函数：发送到 /api/upload，返回 URL
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

    // 封面图上传
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

    // 展览图片上传（指定位置插入）
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(index);
        try {
            const url = await uploadFile(file);
            const newImages = [...formData.images];
            if (index < newImages.length) {
                newImages[index] = url;
            } else {
                newImages.push(url);
            }
            handleChange('images', newImages);
        } catch (err) {
            alert(err instanceof Error ? err.message : '图片上传失败');
        } finally {
            setUploadingImage(null);
        }
    };

    const addImage = () => {
        handleChange('images', [...formData.images, '']);
    };

    const removeImage = (index: number) => {
        handleChange('images', formData.images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 自动计算状态，不需要手动选择
            const autoStatus = calcStatus(formData.start_date, formData.end_date);

            // NOTE: 后端仍需要英文字段，这里用中文值填充以确保兼容性
            const payload = {
                ...formData,
                status: autoStatus,
                title_en: formData.title_zh,
                venue_en: formData.venue_zh,
                description_en: formData.description_zh,
                address_en: formData.address_zh,
                hours_en: formData.hours_zh,
                booking_url: formData.booking_url,
            };

            if (isEdit && initialData) {
                await updateExhibition(initialData.id, payload);
            } else {
                await createExhibition(payload);
            }
            router.push('/admin');
            router.refresh();
        } catch (err) {
            const msg = err instanceof Error ? err.message : '未知错误';
            alert(`${isEdit ? '更新' : '创建'}失败：${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // 实时计算当前预计状态（仅用于展示）
    const previewStatus = calcStatus(formData.start_date, formData.end_date);
    const statusLabels = { recent: '即将开幕 / 进行中', ending: '即将结束（30天内）', longTerm: '长期展览（超过1年）' };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 -ml-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">{isEdit ? '编辑展览' : '新建展览'}</h1>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 基本信息 */}
                <section className="space-y-6 md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">基本信息</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">展览标题 *</label>
                            <input type="text" required value={formData.title_zh} onChange={e => handleChange('title_zh', e.target.value)} placeholder="请输入展览名称" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">门票</label>
                            <select value={formData.price} onChange={e => handleChange('price', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl bg-white">
                                <option value="paid">收费</option>
                                <option value="free">免费</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">展览简介</label>
                            <textarea rows={4} value={formData.description_zh} onChange={e => handleChange('description_zh', e.target.value)} placeholder="请输入展览描述" className="w-full p-3 border border-neutral-200 rounded-xl resize-none" />
                        </div>

                        {/* 封面图上传 */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">封面图片 *</label>
                            <div className="flex gap-4 items-start">
                                {/* 预览 */}
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
                                    <p className="text-xs text-neutral-400">支持 JPG、PNG、WebP，最大 5MB</p>
                                    {/* 也支持直接粘贴 URL */}
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

                {/* 场馆与位置 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">场馆与位置</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">场馆名称 *</label>
                            <input type="text" required value={formData.venue_zh} onChange={e => handleChange('venue_zh', e.target.value)} placeholder="如：上海当代艺术博物馆" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">大洲 *</label>
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
                                <label className="text-sm font-medium">国家 *</label>
                                <input type="text" required value={formData.country} onChange={e => handleChange('country', e.target.value)} placeholder="如：中国" className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">城市 *</label>
                                <input type="text" required value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="如：上海" className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">详细地址</label>
                            <input type="text" value={formData.address_zh} onChange={e => handleChange('address_zh', e.target.value)} placeholder="如：上海市黄浦区花园港路200号" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                    </div>
                </section>

                {/* 时间与实用信息 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">时间与实用信息</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">开幕日期 *</label>
                                <input type="date" required value={formData.start_date} onChange={e => handleChange('start_date', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">闭幕日期 *</label>
                                <input type="date" required value={formData.end_date} onChange={e => handleChange('end_date', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                        </div>

                        {/* 状态自动计算提示 */}
                        {formData.start_date && formData.end_date && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2.5 rounded-xl">
                                <Info className="w-4 h-4 shrink-0" />
                                系统将自动标记为：<strong>{statusLabels[previewStatus]}</strong>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">开放时间</label>
                            <input type="text" value={formData.hours_zh} onChange={e => handleChange('hours_zh', e.target.value)} placeholder="如：周二至周日 10:00-18:00，周一闭馆" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">预约网址</label>
                            <input type="text" value={formData.booking_url} onChange={e => handleChange('booking_url', e.target.value)} placeholder="如：https://xxx.com/tickets" className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                    </div>
                </section>

                {/* 参展艺术家 */}
                <section className="space-y-4 bg-white p-6 rounded-2xl border border-neutral-200">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <h2 className="text-lg font-bold">参展艺术家</h2>
                        <button type="button" onClick={() => handleChange('artists', [...formData.artists, ''])} className="text-sm font-medium flex items-center gap-1 text-blue-600 hover:text-blue-700">
                            <Plus className="w-4 h-4" /> 添加
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.artists.map((artist, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input type="text" value={artist} onChange={e => { const a = [...formData.artists]; a[idx] = e.target.value; handleChange('artists', a); }} placeholder="艺术家姓名" className="flex-1 p-3 border border-neutral-200 rounded-xl" />
                                <button type="button" onClick={() => handleChange('artists', formData.artists.filter((_, i) => i !== idx))} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {formData.artists.length === 0 && <p className="text-sm text-neutral-400">暂未添加艺术家</p>}
                    </div>
                </section>

                {/* 展览图片 */}
                <section className="space-y-4 bg-white p-6 rounded-2xl border border-neutral-200">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <h2 className="text-lg font-bold">展览图片</h2>
                        <button type="button" onClick={addImage} className="text-sm font-medium flex items-center gap-1 text-blue-600 hover:text-blue-700">
                            <Plus className="w-4 h-4" /> 添加
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-2">
                                        {img && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={img} alt={`图片${idx + 1}`} className="w-full h-32 object-cover rounded-xl border border-neutral-200" />
                                        )}
                                        <div className="flex gap-2">
                                            <label className="flex items-center gap-1.5 px-3 py-2 border border-neutral-300 rounded-xl text-sm cursor-pointer hover:bg-neutral-50 disabled:opacity-50">
                                                <Upload className="w-3.5 h-3.5" />
                                                {uploadingImage === idx ? '上传中...' : '上传'}
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, idx)} disabled={uploadingImage !== null} />
                                            </label>
                                            <input
                                                type="text"
                                                value={img}
                                                onChange={e => { const imgs = [...formData.images]; imgs[idx] = e.target.value; handleChange('images', imgs); }}
                                                placeholder="或输入图片 URL"
                                                className="flex-1 p-2.5 border border-neutral-200 rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeImage(idx)} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 self-start">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {formData.images.length === 0 && <p className="text-sm text-neutral-400">暂未添加图片</p>}
                    </div>
                </section>
            </div>
        </form>
    );
}
