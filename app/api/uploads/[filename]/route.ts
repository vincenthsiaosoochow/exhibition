import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

/**
 * GET /api/uploads/[filename] — 提供已上传图片的读取接口
 * 从持久化目录或临时目录读取文件并返回响应流
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        
        // 确保没有路径穿越漏洞
        if (filename.includes('/') || filename.includes('..')) {
            return new NextResponse('Invalid filename', { status: 400 });
        }

        // 优先考虑挂载点（针对 Zeabur），如果无法写入，降级到项目目录 `.data/uploads`，再降级到 `/tmp/uploads`
        const rootDirs = [
            path.join(process.cwd(), '.data', 'uploads'),
            '/tmp/exhibition_uploads'
        ];

        let filePath = '';
        for (const dir of rootDirs) {
            const p = path.join(dir, filename);
            if (fs.existsSync(p)) {
                filePath = p;
                break;
            }
        }

        if (!filePath) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const buffer = fs.readFileSync(filePath);
        
        // 简单判断 MIME 类型
        const ext = path.extname(filename).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.gif') mimeType = 'image/gif';
        if (ext === '.svg') mimeType = 'image/svg+xml';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (err) {
        console.error('[GET /api/uploads/[filename]]', err);
        return new NextResponse('Server Error', { status: 500 });
    }
}
