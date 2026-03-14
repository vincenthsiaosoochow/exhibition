import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb, initDb } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) { await initDb(); dbInitialized = true; }
}

/**
 * POST /api/auth/change-password — 修改管理员密码（需要当前密码验证）
 */
export async function POST(req: NextRequest) {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;
    const { username } = authResult;

    try {
        await ensureDb();
        const body = await req.json();
        const { old_password, new_password } = body as { old_password?: string; new_password?: string };

        if (!old_password || !new_password) {
            return NextResponse.json({ detail: '请填写当前密码和新密码' }, { status: 400 });
        }
        if (new_password.length < 6) {
            return NextResponse.json({ detail: '新密码至少需要 6 位' }, { status: 400 });
        }

        const db = getDb();
        const [rows] = await db.execute<RowDataPacket[]>(
            'SELECT hashed_password FROM admins WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return NextResponse.json({ detail: '用户不存在' }, { status: 404 });
        }

        const valid = await verifyPassword(old_password, rows[0].hashed_password as string);
        if (!valid) {
            return NextResponse.json({ detail: '当前密码错误' }, { status: 401 });
        }

        const newHashed = await hashPassword(new_password);
        await db.execute('UPDATE admins SET hashed_password = ? WHERE username = ?', [newHashed, username]);

        return NextResponse.json({ message: '密码修改成功' });
    } catch (err) {
        console.error('[POST /api/auth/change-password]', err);
        return NextResponse.json({ detail: '服务器内部错误' }, { status: 500 });
    }
}
