'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExhibition, updateExhibition } from '@/lib/admin-api';
import { Exhibition } from '@/lib/data';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface AdminExhibitionFormProps {
    initialData?: Exhibition;
    isEdit?: boolean;
}

export default function AdminExhibitionForm({ initialData, isEdit }: AdminExhibitionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // 初始化扁平数据，适配后端 API 结构
    const [formData, setFormData] = useState({
        title_en: initialData?.title?.en || '',
        title_zh: initialData?.title?.zh || '',
        venue_en: initialData?.venue?.en || '',
        venue_zh: initialData?.venue?.zh || '',
        continent: initialData?.location?.continent || 'Europe',
        country: initialData?.location?.country || '',
        city: initialData?.location?.city || '',
        start_date: initialData?.startDate || '',
        end_date: initialData?.endDate || '',
        cover_image: initialData?.coverImage || '',
        price: initialData?.price || 'paid',
        status: initialData?.status || 'recent',
        description_en: initialData?.description?.en || '',
        description_zh: initialData?.description?.zh || '',
        address_en: initialData?.address?.en || '',
        address_zh: initialData?.address?.zh || '',
        hours_en: initialData?.hours?.en || '',
        hours_zh: initialData?.hours?.zh || '',
        transport_en: initialData?.transport?.en || '',
        transport_zh: initialData?.transport?.zh || '',
        artists: initialData?.artists || [],
        images: initialData?.images || []
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: 'artists' | 'images', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        handleChange(field, newArray);
    };

    const addArrayItem = (field: 'artists' | 'images') => {
        handleChange(field, [...formData[field], '']);
    };

    const removeArrayItem = (field: 'artists' | 'images', index: number) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        handleChange(field, newArray);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit && initialData) {
                await updateExhibition(initialData.id, formData);
            } else {
                await createExhibition(formData);
            }
            router.push('/admin');
            router.refresh();
        } catch (err) {
            alert(isEdit ? '更新失败' : '创建失败');
        } finally {
            setLoading(false);
        }
    };

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
                            <label className="text-sm font-medium">中文标题 *</label>
                            <input type="text" required value={formData.title_zh} onChange={e => handleChange('title_zh', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">英文标题 *</label>
                            <input type="text" required value={formData.title_en} onChange={e => handleChange('title_en', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">中文描述 *</label>
                            <textarea required rows={4} value={formData.description_zh} onChange={e => handleChange('description_zh', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">英文描述 *</label>
                            <textarea required rows={4} value={formData.description_en} onChange={e => handleChange('description_en', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">封面图 URL *</label>
                            <input type="url" required value={formData.cover_image} onChange={e => handleChange('cover_image', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">状态 *</label>
                                <select value={formData.status} onChange={e => handleChange('status', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl bg-white">
                                    <option value="recent">Recent (近期)</option>
                                    <option value="ending">Ending Soon (即将结束)</option>
                                    <option value="longTerm">Long Term (长期)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">门票 *</label>
                                <select value={formData.price} onChange={e => handleChange('price', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl bg-white">
                                    <option value="paid">Paid (收费)</option>
                                    <option value="free">Free (免费)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 场馆与位置 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">场馆与位置</h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">中文场馆 *</label>
                                <input type="text" required value={formData.venue_zh} onChange={e => handleChange('venue_zh', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">英文场馆 *</label>
                                <input type="text" required value={formData.venue_en} onChange={e => handleChange('venue_en', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">大洲 *</label>
                                <select value={formData.continent} onChange={e => handleChange('continent', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl bg-white">
                                    <option value="Europe">Europe</option>
                                    <option value="Asia">Asia</option>
                                    <option value="North America">North America</option>
                                    <option value="Africa">Africa</option>
                                    <option value="South America">South America</option>
                                    <option value="Oceania">Oceania</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">国家 *</label>
                                <input type="text" required value={formData.country} onChange={e => handleChange('country', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">城市 *</label>
                                <input type="text" required value={formData.city} onChange={e => handleChange('city', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">中文地址 *</label>
                            <input type="text" required value={formData.address_zh} onChange={e => handleChange('address_zh', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">英文地址 *</label>
                            <input type="text" required value={formData.address_en} onChange={e => handleChange('address_en', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>
                    </div>
                </section>

                {/* 实用信息 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <h2 className="text-lg font-bold border-b border-neutral-100 pb-3">实用信息</h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">开始日期 *</label>
                                <input type="date" required value={formData.start_date} onChange={e => handleChange('start_date', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">结束日期 *</label>
                                <input type="date" required value={formData.end_date} onChange={e => handleChange('end_date', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">中文开放时间 *</label>
                            <input type="text" required value={formData.hours_zh} onChange={e => handleChange('hours_zh', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">中文交通指南 *</label>
                            <input type="text" required value={formData.transport_zh} onChange={e => handleChange('transport_zh', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl" />
                        </div>

                        {/* 为了排版紧凑省略了英文时间/交通的单列输入框，可以在完善时加入 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-500">英文开放时间</label>
                                <input type="text" value={formData.hours_en} onChange={e => handleChange('hours_en', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl bg-neutral-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-500">英文交通指南</label>
                                <input type="text" value={formData.transport_en} onChange={e => handleChange('transport_en', e.target.value)} className="w-full p-3 border border-neutral-200 rounded-xl bg-neutral-50" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 艺术家名单 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <h2 className="text-lg font-bold">参展艺术家</h2>
                        <button type="button" onClick={() => addArrayItem('artists')} className="text-sm text-fuhung-blue font-medium flex items-center gap-1">
                            <Plus className="w-4 h-4" /> 添加
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.artists.map((artist, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input type="text" required value={artist} onChange={e => handleArrayChange('artists', idx, e.target.value)} placeholder="艺术家名称" className="flex-1 p-3 border border-neutral-200 rounded-xl" />
                                <button type="button" onClick={() => removeArrayItem('artists', idx)} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                        {formData.artists.length === 0 && <p className="text-sm text-neutral-400">暂无艺术家</p>}
                    </div>
                </section>

                {/* 图片列表 */}
                <section className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <h2 className="text-lg font-bold">展览图片</h2>
                        <button type="button" onClick={() => addArrayItem('images')} className="text-sm text-fuhung-blue font-medium flex items-center gap-1">
                            <Plus className="w-4 h-4" /> 添加
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input type="url" required value={img} onChange={e => handleArrayChange('images', idx, e.target.value)} placeholder="图片 URL" className="flex-1 p-3 border border-neutral-200 rounded-xl" />
                                <button type="button" onClick={() => removeArrayItem('images', idx)} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                        {formData.images.length === 0 && <p className="text-sm text-neutral-400">暂无图片</p>}
                    </div>
                </section>
            </div>
        </form>
    );
}
