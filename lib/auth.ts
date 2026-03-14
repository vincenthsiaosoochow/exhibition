/**
 * 认证工具层 - JWT 签发/校验 及 密码哈希
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'CHANGE_THIS_IN_PRODUCTION_USE_RANDOM_32_CHARS';
const ACCESS_TOKEN_EXPIRE_HOURS = 24;

export function signToken(payload: Record<string, string>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: `${ACCESS_TOKEN_EXPIRE_HOURS}h` });
}

export function verifyToken(token: string): { sub: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { sub: string };
    } catch {
        return null;
    }
}

export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

/**
 * API Route 鉴权中间件：从 Authorization: Bearer <token> 中提取并验证 JWT。
 * 返回 null 说明已授权（调用方继续执行），返回 NextResponse 说明鉴权失败。
 */
export function requireAdmin(req: NextRequest): { username: string } | NextResponse {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ detail: '未提供认证信息' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
        return NextResponse.json({ detail: '无效的 Token，请重新登录' }, { status: 401 });
    }
    return { username: payload.sub };
}
