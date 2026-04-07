import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initDb();
        dbInitialized = true;
    }
}

interface VenueRow extends RowDataPacket {
    id: number;
    name_zh: string;
    name_en: string;
    continent: string;
    country: string;
    city: string;
    address_zh: string;
    address_en: string;
    hours_zh: string;
    hours_en: string;
    cover_image: string;
    description_zh: string | null;
    description_en: string | null;
    website: string;
}

/**
 * GET /api/venues/[id] — 获取单个场馆详情
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await ensureDb();
        const db = getDb();
        const [rows] = await db.execute<VenueRow[]>('SELECT * FROM venues WHERE id = ?', [params.id]);

        if (rows.length === 0) {
            return NextResponse.json({ detail: 'Venue not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error('[GET /api/venues/:id]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}

/**
 * PUT /api/venues/[id] — 更新场馆（需要管理员权限）
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        await ensureDb();
        const db = getDb();
        const body = await req.json();

        // 只更新传入的字段（过滤 undefined）
        const allowedFields = [
            'name_zh', 'name_en', 'continent', 'country', 'city',
            'address_zh', 'address_en', 'hours_zh', 'hours_en',
            'cover_image', 'description_zh', 'description_en', 'website',
        ];
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(body[field] ?? null);
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ detail: '没有可更新的字段' }, { status: 400 });
        }

        values.push(params.id);
        await db.execute(`UPDATE venues SET ${updates.join(', ')} WHERE id = ?`, values);

        const [rows] = await db.execute<VenueRow[]>('SELECT * FROM venues WHERE id = ?', [params.id]);
        if (rows.length === 0) {
            return NextResponse.json({ detail: 'Venue not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error('[PUT /api/venues/:id]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}

/**
 * DELETE /api/venues/[id] — 删除场馆（需要管理员权限）
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        await ensureDb();
        const db = getDb();
        const [result] = await db.execute<import('mysql2').ResultSetHeader>(
            'DELETE FROM venues WHERE id = ?',
            [params.id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ detail: 'Venue not found' }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error('[DELETE /api/venues/:id]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
