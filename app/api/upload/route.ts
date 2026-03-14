import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

/**
 * POST /api/upload — 上传图片文件，保存到 public/uploads 目录，返回可访问 URL
 * 需要管理员权限
 */
export async function POST(req: NextRequest) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ detail: '未上传文件' }, { status: 400 });
        }

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ detail: '只允许上传图片文件' }, { status: 400 });
        }

        // 限制文件大小：最大 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ detail: '图片大小不能超过 5MB' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 将文件转换为 base64 string
        const base64String = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        const url = `data:${mimeType};base64,${base64String}`;

        return NextResponse.json({ url });
    } catch (err) {
        console.error('[POST /api/upload]', err);
        return NextResponse.json({ detail: '上传失败，请重试' }, { status: 500 });
    }
}
