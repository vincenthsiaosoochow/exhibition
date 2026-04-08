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
 * GET /api/venues — 获取场馆列表，支持地区筛选和关键词搜索
 * NOTE: 列表模式不返回 cover_image 全量 Base64，改用 /api/cover/venue/[id] 代理 URL，
 * 防止 51MB+ 响应超出 Next.js 2MB 数据缓存限制
 */
export async function GET(req: NextRequest) {
    try {
        await ensureDb();
        const db = getDb();
        const { searchParams } = req.nextUrl;

        // NOTE: 排除 cover_image 大字段，通过代理路由按需加载
        let query = 'SELECT id, name_zh, name_en, continent, country, city, address_zh, address_en, hours_zh, hours_en, description_zh, description_en, website, (cover_image IS NOT NULL AND cover_image != \'\') AS has_cover FROM venues WHERE 1=1';
        const params: (string | number)[] = [];

        const search = searchParams.get('search');
        if (search) {
            query += ' AND (name_zh LIKE ? OR name_en LIKE ? OR city LIKE ?)';
            const kw = `%${search}%`;
            params.push(kw, kw, kw);
        }

        const continent = searchParams.get('continent');
        if (continent && continent !== 'all') {
            query += ' AND continent = ?';
            params.push(continent);
        }

        const country = searchParams.get('country');
        if (country && country !== 'all') {
            query += ' AND country = ?';
            params.push(country);
        }

        const city = searchParams.get('city');
        if (city && city !== 'all') {
            query += ' AND city = ?';
            params.push(city);
        }

        query += ' ORDER BY name_zh ASC';

        const [rows] = await db.execute<VenueRow[]>(query, params);

        // 将 has_cover 标记转换为代理 URL
        const items = rows.map((row) => ({
            ...row,
            cover_image: (row as unknown as { has_cover: number }).has_cover
                ? `/api/cover/venue/${row.id}`
                : '',
        }));

        return NextResponse.json({ total: items.length, items }, {
            headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
        });
    } catch (err) {
        console.error('[GET /api/venues]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}


/**
 * POST /api/venues — 创建场馆（需要管理员权限）
 */
export async function POST(req: NextRequest) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        await ensureDb();
        const db = getDb();
        const body = await req.json();

        const [result] = await db.execute<ResultSetHeader>(
            `INSERT INTO venues
             (name_zh, name_en, continent, country, city,
              address_zh, address_en, hours_zh, hours_en,
              cover_image, description_zh, description_en, website)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                body.name_zh || '',
                body.name_en || '',
                body.continent || '',
                body.country || '',
                body.city || '',
                body.address_zh || '',
                body.address_en || '',
                body.hours_zh || '',
                body.hours_en || '',
                body.cover_image || '',
                body.description_zh || '',
                body.description_en || '',
                body.website || '',
            ]
        );

        const venueId = result.insertId;
        const [rows] = await db.execute<VenueRow[]>('SELECT * FROM venues WHERE id = ?', [venueId]);

        return NextResponse.json(rows[0], { status: 201 });
    } catch (err) {
        console.error('[POST /api/venues]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
