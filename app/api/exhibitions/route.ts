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
    title_en: string; title_zh: string;
    venue_en: string; venue_zh: string;
    continent: string; country: string; city: string;
    start_date: string; end_date: string;
    cover_image: string;
    price: string; status: string;
    description_en: string; description_zh: string;
    address_en: string; address_zh: string;
    hours_en: string; hours_zh: string;
    booking_url: string;
    artist_names: string | null;
    image_urls: string | null;
}

/**
 * NOTE: 使用 GROUP_CONCAT 替代 N+1 查询模式，一次 SQL 获取展览+艺术家+图片
 * 将之前 1 + N*2 次查询优化为固定 1 次查询
 */
const EXHIBITION_SELECT_QUERY = `
    SELECT e.*,
           GROUP_CONCAT(DISTINCT ea.artist_name ORDER BY ea.artist_name SEPARATOR '|||') AS artist_names
    FROM exhibitions e
    LEFT JOIN exhibition_artists ea ON ea.exhibition_id = e.id
`;

function parseExhibitionRow(row: ExhibitionRow, mode: 'list' | 'detail' = 'list') {
    // NOTE: 列表模式下，Base64 图片只保留类型标记，不返回完整内容
    // 这样可将每条数据从几百KB缩短回几百字节，大幅减少传输量
    const coverImage = row.cover_image?.startsWith('data:')
        ? (mode === 'list' ? `/api/cover/${row.id}` : row.cover_image)
        : (row.cover_image || '');

    return {
        ...row,
        cover_image: coverImage,
        artists: row.artist_names ? row.artist_names.split('|||') : [],
        images: [] as string[], // 列表模式和返回创建结果时不再需要详细图片
    };
}

/**
 * GET /api/exhibitions — 获取展览列表，支持多维度筛选
 * 优化：使用单次 JOIN + GROUP_CONCAT 查询替代 N+1 模式
 */
export async function GET(req: NextRequest) {
    try {
        await ensureDb();
        const db = getDb();
        const { searchParams } = req.nextUrl;

        let query = EXHIBITION_SELECT_QUERY + 'WHERE 1=1';
        const params: (string | number)[] = [];

        const search = searchParams.get('search');
        if (search) {
            query += ' AND (e.title_en LIKE ? OR e.title_zh LIKE ? OR e.venue_en LIKE ? OR e.venue_zh LIKE ?)';
            const kw = `%${search}%`;
            params.push(kw, kw, kw, kw);
        }

        const continent = searchParams.get('continent');
        if (continent && continent !== 'all') { query += ' AND e.continent = ?'; params.push(continent); }

        const country = searchParams.get('country');
        if (country && country !== 'all') { query += ' AND e.country = ?'; params.push(country); }

        const city = searchParams.get('city');
        if (city && city !== 'all') { query += ' AND e.city = ?'; params.push(city); }

        const status = searchParams.get('status');
        if (status && status !== 'all') { query += ' AND e.status = ?'; params.push(status); }

        const price = searchParams.get('price');
        if (price && price !== 'all') { query += ' AND e.price = ?'; params.push(price); }

        const venueId = searchParams.get('venue_id');
        if (venueId) { query += ' AND e.venue_id = ?'; params.push(parseInt(venueId, 10)); }

        const sortBy = searchParams.get('sort_by');
        // NOTE: sort_by=views 时按浏览量降序（热门排序），默认按开始日期降序
        if (sortBy === 'views') {
            query += ' GROUP BY e.id ORDER BY COALESCE(e.view_count, 0) DESC';
        } else {
            query += ' GROUP BY e.id ORDER BY e.start_date DESC';
        }

        const [rows] = await db.execute<ExhibitionRow[]>(query, params);
        const items = rows.map((row) => parseExhibitionRow(row, 'list'));

        return NextResponse.json({ total: items.length, items }, {
            headers: {
                // NOTE: 缓存60秒，降低数据库压力，同时对展览数据的时效性影响极小
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
            }
        });
    } catch (err) {
        console.error('[GET /api/exhibitions]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
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
       address_en, address_zh, hours_en, hours_zh, booking_url, venue_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.title_en, data.title_zh, data.venue_en, data.venue_zh,
                data.continent, data.country, data.city,
                data.start_date, data.end_date, data.cover_image || '',
                data.price || 'paid', data.status || 'recent',
                data.description_en || '', data.description_zh || '',
                data.address_en || '', data.address_zh || '',
                data.hours_en || '', data.hours_zh || '',
                data.booking_url || '',
                data.venue_id || null,
            ]
        );

        const exhibitionId = result.insertId;

        for (const name of artists as string[]) {
            await db.execute('INSERT INTO exhibition_artists (exhibition_id, artist_name) VALUES (?, ?)', [exhibitionId, name]);
        }
        for (let i = 0; i < (images as { url: string; caption: string }[]).length; i++) {
            const img = images[i] as { url: string; caption: string };
            await db.execute(
                'INSERT INTO exhibition_images (exhibition_id, image_url, sort_order, caption) VALUES (?, ?, ?, ?)',
                [exhibitionId, img.url, i, img.caption || null]
            );
        }

        // 查询刚创建的展览并返回完整数据
        const [rows] = await db.execute<ExhibitionRow[]>(
            EXHIBITION_SELECT_QUERY + ' WHERE e.id = ? GROUP BY e.id',
            [exhibitionId]
        );
        const exhibition = rows.length > 0 ? parseExhibitionRow(rows[0]) : null;
        return NextResponse.json(exhibition, { status: 201 });
    } catch (err) {
        console.error('[POST /api/exhibitions]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
