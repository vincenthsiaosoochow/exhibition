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

        // 生成唯一文件名（时间戳 + 随机数）
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        // 保存到 public/uploads 目录
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);

        // 返回可访问的 URL
        const url = `/uploads/${filename}`;
        return NextResponse.json({ url });
    } catch (err) {
        console.error('[POST /api/upload]', err);
        return NextResponse.json({ detail: '上传失败，请重试' }, { status: 500 });
    }
}
