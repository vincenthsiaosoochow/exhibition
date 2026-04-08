import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

/**
 * GET /api/cover/venue/[id] — 从数据库读取场馆封面图并作为图片流返回
 * 与展览封面代理路由 /api/cover/[id] 逻辑相同，但查询 venues 表
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const venueId = parseInt(id, 10);

        if (isNaN(venueId)) {
            return new NextResponse('Invalid ID', { status: 400 });
        }

        const db = getDb();
        const [rows] = await db.execute<RowDataPacket[]>(
            'SELECT cover_image FROM venues WHERE id = ?',
            [venueId]
        );

        if (rows.length === 0 || !rows[0].cover_image) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const coverImage: string = rows[0].cover_image;

        if (coverImage.startsWith('data:')) {
            const [header, b64] = coverImage.split(',');
            const mimeType = header.split(';')[0].replace('data:', '') || 'image/jpeg';
            const buffer = Buffer.from(b64, 'base64');

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
                },
            });
        }

        // 普通 URL：重定向
        return NextResponse.redirect(coverImage);
    } catch (err) {
        console.error('[GET /api/cover/venue/[id]]', err);
        return new NextResponse('Server Error', { status: 500 });
    }
}
