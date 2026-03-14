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

interface ExhibitionRow extends RowDataPacket {
    id: number;
    [key: string]: unknown;
    artist_names: string | null;
    image_urls: string | null;
}

/**
 * NOTE: 使用 GROUP_CONCAT 单次 JOIN 查询替代原来分三次查询的 N+1 模式
 */
const EXHIBITION_BY_ID_QUERY = `
    SELECT e.*,
           GROUP_CONCAT(DISTINCT ea.artist_name ORDER BY ea.artist_name SEPARATOR '|||') AS artist_names,
           GROUP_CONCAT(ei.image_url ORDER BY ei.sort_order SEPARATOR '|||') AS image_urls
    FROM exhibitions e
    LEFT JOIN exhibition_artists ea ON ea.exhibition_id = e.id
    LEFT JOIN exhibition_images ei ON ei.exhibition_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
`;

function parseRow(row: ExhibitionRow) {
    return {
        ...row,
        artists: row.artist_names ? String(row.artist_names).split('|||') : [],
        images: row.image_urls ? String(row.image_urls).split('|||') : [],
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
        const [rows] = await db.execute<ExhibitionRow[]>(EXHIBITION_BY_ID_QUERY, [exhibitionId]);

        if (rows.length === 0) {
            return NextResponse.json({ detail: '展览不存在' }, { status: 404 });
        }

        return NextResponse.json(parseRow(rows[0]));
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

        const [rows] = await db.execute<ExhibitionRow[]>(EXHIBITION_BY_ID_QUERY, [exhibitionId]);
        if (rows.length === 0) {
            return NextResponse.json({ detail: '展览不存在' }, { status: 404 });
        }

        return NextResponse.json(parseRow(rows[0]));
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
