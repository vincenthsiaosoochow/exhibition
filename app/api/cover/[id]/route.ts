import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

/**
 * GET /api/cover/[id] — 从数据库读取封面图并作为图片流返回
 * 这是为了解决 Base64 图片存储在列表 API 中体积过大的问题
 * 通过按需加载，只在需要时才从数据库读取图片内容
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const exhibitionId = parseInt(id, 10);

        if (isNaN(exhibitionId)) {
            return new NextResponse('Invalid ID', { status: 400 });
        }

        const db = getDb();
        const [rows] = await db.execute<RowDataPacket[]>(
            'SELECT cover_image FROM exhibitions WHERE id = ?',
            [exhibitionId]
        );

        if (rows.length === 0 || !rows[0].cover_image) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const coverImage: string = rows[0].cover_image;

        // 如果是 Base64，解码并以图片流返回
        if (coverImage.startsWith('data:')) {
            const [header, b64] = coverImage.split(',');
            const mimeType = header.split(';')[0].replace('data:', '') || 'image/jpeg';
            const buffer = Buffer.from(b64, 'base64');

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    // NOTE: 图片内容基本不变，长期缓存以避免重复查询数据库
                    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
                },
            });
        }

        // 普通 URL：重定向
        return NextResponse.redirect(coverImage);
    } catch (err) {
        console.error('[GET /api/cover/[id]]', err);
        return new NextResponse('Server Error', { status: 500 });
    }
}
