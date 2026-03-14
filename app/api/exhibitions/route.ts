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

// NOTE: 将扁平的 SQL 行数据转换为带关联的展览响应对象
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
 * GET /api/exhibitions — 获取展览列表，支持多维度筛选
 */
export async function GET(req: NextRequest) {
    try {
        await ensureDb();
        const db = getDb();
        const { searchParams } = req.nextUrl;

        let query = 'SELECT * FROM exhibitions WHERE 1=1';
        const params: (string | number)[] = [];

        const search = searchParams.get('search');
        if (search) {
            query += ' AND (title_en LIKE ? OR title_zh LIKE ? OR venue_en LIKE ? OR venue_zh LIKE ?)';
            const kw = `%${search}%`;
            params.push(kw, kw, kw, kw);
        }

        const continent = searchParams.get('continent');
        if (continent && continent !== 'all') { query += ' AND continent = ?'; params.push(continent); }

        const country = searchParams.get('country');
        if (country && country !== 'all') { query += ' AND country = ?'; params.push(country); }

        const city = searchParams.get('city');
        if (city && city !== 'all') { query += ' AND city = ?'; params.push(city); }

        const status = searchParams.get('status');
        if (status && status !== 'all') { query += ' AND status = ?'; params.push(status); }

        const price = searchParams.get('price');
        if (price && price !== 'all') { query += ' AND price = ?'; params.push(price); }

        const [rows] = await db.execute<RowDataPacket[]>(query, params);

        // 批量加载每个展览的关联数据
        const items = await Promise.all(
            rows.map((row) => fetchExhibitionWithRelations(db, row.id as number))
        );

        return NextResponse.json({ total: items.length, items });
    } catch (err) {
        console.error('[GET /api/exhibitions]', err);
        return NextResponse.json({ detail: '服务器内部错误' }, { status: 500 });
    }
}

/**
 * POST /api/exhibitions — 创建展览（需要管理员权限）
 */
export async function POST(req: NextRequest) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        await ensureDb();
        const db = getDb();
        const body = await req.json();
        const { artists = [], images = [], ...data } = body;

        const [result] = await db.execute<ResultSetHeader>(
            `INSERT INTO exhibitions (title_en, title_zh, venue_en, venue_zh, continent, country, city,
       start_date, end_date, cover_image, price, status, description_en, description_zh,
       address_en, address_zh, hours_en, hours_zh, transport_en, transport_zh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.title_en, data.title_zh, data.venue_en, data.venue_zh,
                data.continent, data.country, data.city,
                data.start_date, data.end_date, data.cover_image || '',
                data.price || 'paid', data.status || 'recent',
                data.description_en || '', data.description_zh || '',
                data.address_en || '', data.address_zh || '',
                data.hours_en || '', data.hours_zh || '',
                data.transport_en || '', data.transport_zh || '',
            ]
        );

        const exhibitionId = result.insertId;

        for (const name of artists as string[]) {
            await db.execute('INSERT INTO exhibition_artists (exhibition_id, artist_name) VALUES (?, ?)', [exhibitionId, name]);
        }
        for (let i = 0; i < (images as string[]).length; i++) {
            await db.execute('INSERT INTO exhibition_images (exhibition_id, image_url, sort_order) VALUES (?, ?, ?)', [exhibitionId, images[i], i]);
        }

        const exhibition = await fetchExhibitionWithRelations(db, exhibitionId);
        return NextResponse.json(exhibition, { status: 201 });
    } catch (err) {
        console.error('[POST /api/exhibitions]', err);
        return NextResponse.json({ detail: '服务器内部错误' }, { status: 500 });
    }
}
