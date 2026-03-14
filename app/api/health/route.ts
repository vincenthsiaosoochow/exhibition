import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initDb();
        dbInitialized = true;
    }
}

export async function GET() {
    try {
        await ensureDb();
        return NextResponse.json({ status: 'ok', service: 'FUHUNG Art Exhibition API (Next.js)' });
    } catch (err) {
        console.error('[GET /api/health]', err);
        return NextResponse.json({ status: 'error', message: String(err) }, { status: 500 });
    }
}
