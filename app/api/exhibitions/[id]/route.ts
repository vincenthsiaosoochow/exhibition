import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initDb();
        dbInitialized = true;
    }
}

async function fetchExhibitionWithRelations(db: Awaited<ReturnType<typeof getDb>>, id: number) {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM exhibitions WHERE id = ?', [id]);
    if (rows.length === 0) return null;

    const [artists] = await db.execute<RowDataPacket[]>(
        'SELECT artist_name FROM exhibition_artists WHERE exhibition_id = ?', [id]
    );
    const [images] = await db.execute<RowDataPacket[]>(
        'SELECT image_url FROM exhibition_images WHERE exhibition_id = ? ORDER BY sort_order', [id]
    );

    return {
        ...rows[0],
        artists: artists.map((a) => a.artist_name as string),
        images: images.map((i) => i.image_url as string),
    };
}

/**
 * GET /api/exhibitions/[id] — 获取单个展览详情
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureDb();
        const { id } = await params;
        const exhibitionId = parseInt(id, 10);

        if (isNaN(exhibitionId)) {
            return NextResponse.json({ detail: '无效的展览 ID' }, { status: 400 });
        }

        const db = getDb();
        const exhibition = await fetchExhibitionWithRelations(db, exhibitionId);

        if (!exhibition) {
            return NextResponse.json({ detail: '展览不存在' }, { status: 404 });
        }

        return NextResponse.json(exhibition);
    } catch (err) {
        console.error('[GET /api/exhibitions/[id]]', err);
        return NextResponse.json({ detail: '服务器内部错误' }, { status: 500 });
    }
}

/**
 * PUT /api/exhibitions/[id] — 更新展览（需要管理员权限）
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        await ensureDb();
        const { id } = await params;
        const exhibitionId = parseInt(id, 10);

        if (isNaN(exhibitionId)) {
            return NextResponse.json({ detail: '无效的展览 ID' }, { status: 400 });
        }

        const db = getDb();
        const body = await req.json();
        const { artists, images, ...data } = body;

        // 构造动态更新语句（只更新传入的非空字段）
        const updateFields: string[] = [];
        const updateValues: (string | number)[] = [];

        const allowedFields = [
            'title_en', 'title_zh', 'venue_en', 'venue_zh', 'continent', 'country', 'city',
            'start_date', 'end_date', 'cover_image', 'price', 'status',
            'description_en', 'description_zh', 'address_en', 'address_zh',
            'hours_en', 'hours_zh', 'booking_url',
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined && data[field] !== null) {
                updateFields.push(`${field} = ?`);
                updateValues.push(data[field] as string | number);
            }
        }

        if (updateFields.length > 0) {
            await db.execute<ResultSetHeader>(
                `UPDATE exhibitions SET ${updateFields.join(', ')} WHERE id = ?`,
                [...updateValues, exhibitionId]
            );
        }

        // 全量替换艺术家和图片（如果传入的话）
        if (artists !== undefined) {
            await db.execute('DELETE FROM exhibition_artists WHERE exhibition_id = ?', [exhibitionId]);
            for (const name of artists as string[]) {
                await db.execute('INSERT INTO exhibition_artists (exhibition_id, artist_name) VALUES (?, ?)', [exhibitionId, name]);
            }
        }

        if (images !== undefined) {
            await db.execute('DELETE FROM exhibition_images WHERE exhibition_id = ?', [exhibitionId]);
            for (let i = 0; i < (images as string[]).length; i++) {
                await db.execute('INSERT INTO exhibition_images (exhibition_id, image_url, sort_order) VALUES (?, ?, ?)', [exhibitionId, images[i], i]);
            }
        }

        const exhibition = await fetchExhibitionWithRelations(db, exhibitionId);
        if (!exhibition) {
            return NextResponse.json({ detail: '展览不存在' }, { status: 404 });
        }

        return NextResponse.json(exhibition);
    } catch (err) {
        console.error('[PUT /api/exhibitions/[id]]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}

/**
 * DELETE /api/exhibitions/[id] — 删除展览（需要管理员权限）
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        await ensureDb();
        const { id } = await params;
        const exhibitionId = parseInt(id, 10);

        if (isNaN(exhibitionId)) {
            return NextResponse.json({ detail: '无效的展览 ID' }, { status: 400 });
        }

        const db = getDb();
        const [result] = await db.execute<ResultSetHeader>(
            'DELETE FROM exhibitions WHERE id = ?',
            [exhibitionId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ detail: '展览不存在' }, { status: 404 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error('[DELETE /api/exhibitions/[id]]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
