import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initDb();
        dbInitialized = true;
    }
}

/**
 * POST /api/exhibitions/[id]/view — 记录展览浏览量
 * NOTE: 无需管理员鉴权，由前端访问详情页时异步触发
 */
export async function POST(
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
        // NOTE: 使用 COALESCE 防止 view_count 为 NULL 时加法失效
        await db.execute(
            'UPDATE exhibitions SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
            [exhibitionId]
        );

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[POST /api/exhibitions/[id]/view]', err);
        return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
