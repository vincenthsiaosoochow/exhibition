'use client';

import { useState, useEffect } from 'react';
import { fetchVenues, Venue } from '@/lib/data';
import { deleteVenue } from '@/lib/admin-api';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Search, Building2, MapPin } from 'lucide-react';

export default function AdminVenues() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        document.title = '场馆管理 | ARTWALK Admin';
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchVenues();
            setVenues(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm('确定要删除这个场馆吗？删除后不可恢复。')) {
            try {
                await deleteVenue(id);
                setVenues(venues.filter(v => v.id !== id));
            } catch {
                alert('删除失败，请检查该场馆是否有关联展览');
            }
        }
    };

    const filtered = venues.filter(v => {
        if (!search) return true;
        const q = search.toLowerCase();
        return v.name_zh.toLowerCase().includes(q) || v.name_en.toLowerCase().includes(q) || v.city.toLowerCase().includes(q);
    });

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">场馆管理</h1>
                    <p className="text-neutral-500 mt-1">管理所有艺术展馆信息</p>
                </div>
                <Link
                    href="/admin/venues/new"
                    className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    新建场馆
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* 工具栏 */}
                <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="搜索场馆名称或城市..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                        />
                    </div>
                </div>

                {/* 列表 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4">场馆名称</th>
                                <th className="px-6 py-4">位置</th>
                                <th className="px-6 py-4">大洲</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">加载中...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                        {venues.length === 0 ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <Building2 className="w-12 h-12 text-neutral-300" />
                                                <p>暂无场馆，点击上方按钮新建</p>
                                            </div>
                                        ) : '未找到相关场馆'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((venue) => (
                                    <tr key={venue.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-100 overflow-hidden relative shrink-0 flex items-center justify-center">
                                                    {venue.cover_image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={venue.cover_image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 className="w-5 h-5 text-indigo-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-neutral-900">{venue.name_zh}</p>
                                                    {venue.name_en && <p className="text-xs text-neutral-500 truncate max-w-[200px]">{venue.name_en}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                                {[venue.city, venue.country].filter(Boolean).join(', ') || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {venue.continent && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                                                    {venue.continent}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/venues/${venue.id}`}
                                                    target="_blank"
                                                    title="前台预览"
                                                    className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Building2 className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/venues/${venue.id}/edit`}
                                                    title="编辑"
                                                    className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(venue.id)}
                                                    title="删除"
                                                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
