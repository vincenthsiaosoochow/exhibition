import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { signToken, verifyPassword } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

// NOTE: 确保数据库已初始化（首次启动时建表并写入种子数据）
let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initDb();
        dbInitialized = true;
    }
}

/**
 * POST /api/auth/login — 管理员登录，返回 JWT
 */
export async function POST(req: Request) {
    try {
        await ensureDb();
        const body = await req.json();
        const { username, password } = body as { username?: string; password?: string };

        if (!username || !password) {
            return NextResponse.json({ detail: '用户名和密码不能为空' }, { status: 400 });
        }

        const db = getDb();
        const [rows] = await db.execute<RowDataPacket[]>(
            'SELECT * FROM admins WHERE username = ? AND is_active = 1',
            [username]
        );

        if (rows.length === 0) {
            return NextResponse.json({ detail: '用户名或密码错误' }, { status: 401 });
        }

        const admin = rows[0];
        const valid = await verifyPassword(password, admin.hashed_password as string);
        if (!valid) {
            return NextResponse.json({ detail: '用户名或密码错误' }, { status: 401 });
        }

        const token = signToken({ sub: admin.username as string });
        return NextResponse.json({ access_token: token, token_type: 'bearer' });
    } catch (err) {
        console.error('[POST /api/auth/login]', err);
        return NextResponse.json({ detail: '服务器内部错误' }, { status: 500 });
    }
}
