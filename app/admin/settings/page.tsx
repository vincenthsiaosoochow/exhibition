'use client';

import { useState } from 'react';
import { getAdminToken, removeAdminToken } from '@/lib/admin-api';
import { Settings, Key, LogOut, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('两次输入的新密码不一致');
            return;
        }
        if (newPassword.length < 6) {
            setError('新密码至少需要 6 位');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = getAdminToken();
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || '修改失败');
            }

            setSuccess(true);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : '修改失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        removeAdminToken();
        router.push('/admin/login');
    };

    return (
        <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-8">
                <Settings className="w-6 h-6" />
                <h1 className="text-2xl font-bold">系统设置</h1>
            </div>

            {/* 修改密码 */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6 mb-6">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Key className="w-5 h-5 text-neutral-500" />
                    <h2 className="text-lg font-bold">修改密码</h2>
                </div>

                {success && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl text-sm">
                        <CheckCircle className="w-4 h-4" />
                        密码修改成功！
                    </div>
                )}
                {error && (
                    <div className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{error}</div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">当前密码</label>
                        <input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            className="w-full p-3 border border-neutral-200 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">新密码</label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full p-3 border border-neutral-200 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">确认新密码</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border border-neutral-200 rounded-xl"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                    >
                        {loading ? '修改中...' : '确认修改'}
                    </button>
                </form>
            </section>

            {/* 退出登录 */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    退出登录
                </button>
            </section>
        </div>
    );
}
