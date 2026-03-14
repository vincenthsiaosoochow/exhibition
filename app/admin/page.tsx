'use client';

import { useState, useEffect } from 'react';
import { fetchExhibitions, Exhibition } from '@/lib/data';
import { deleteExhibition } from '@/lib/admin-api';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Search, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';


export default function AdminExhibitions() {
    const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        document.title = 'Admin Dashboard | WORLD ART EXHIBITION';
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchExhibitions();
            setExhibitions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这个展览吗？删除后不可恢复。')) {
            try {
                await deleteExhibition(id);
                setExhibitions(exhibitions.filter(ex => ex.id !== id));
            } catch (e) {
                alert('删除失败');
            }
        }
    };

    const filtered = exhibitions.filter(ex => {
        if (!search) return true;
        const q = search.toLowerCase();
        return ex.title.zh.toLowerCase().includes(q) || ex.title.en.toLowerCase().includes(q) || ex.venue.zh.toLowerCase().includes(q);
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">展览管理</h1>
                    <p className="text-neutral-500 mt-1">管理应用中的所有艺术展览信息</p>
                </div>
                <Link
                    href="/admin/exhibitions/new"
                    className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    新建展览
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* 工具栏 */}
                <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="搜索展览标题或场馆..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuhung-blue/20 focus:border-fuhung-blue text-sm"
                        />
                    </div>
                </div>

                {/* 列表 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4">展览标题</th>
                                <th className="px-6 py-4">时间</th>
                                <th className="px-6 py-4">场馆</th>
                                <th className="px-6 py-4">状态</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                        未找到相关展览
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((ex) => (
                                    <tr key={ex.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden relative shrink-0">
                                                    <Image src={ex.coverImage} alt="" fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-neutral-900 truncate max-w-[200px] xl:max-w-xs">{ex.title.zh}</p>
                                                    <p className="text-xs text-neutral-500 truncate max-w-[200px] xl:max-w-xs">{ex.title.en}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600">
                                            {format(parseISO(ex.startDate), 'yyyy-MM-dd')}
                                            <br />
                                            <span className="text-xs text-neutral-400">to</span> {format(parseISO(ex.endDate), 'yyyy-MM-dd')}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 truncate max-w-[150px]">
                                            {ex.venue.zh}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 uppercase">
                                                {ex.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/exhibition/${ex.id}`}
                                                    target="_blank"
                                                    title="前台预览"
                                                    className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/exhibitions/${ex.id}/edit`}
                                                    title="编辑"
                                                    className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(ex.id)}
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
