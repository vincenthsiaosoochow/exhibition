/**
 * 数据库连接层 - 使用 mysql2 连接 MySQL
 * 支持通过 DATABASE_URL 或 MYSQL_* 环境变量自动配置
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// NOTE: 解析 DATABASE_URL 或 MYSQL_URI，或从 MYSQL_* 环境变量拼装连接配置
function getDbConfig() {
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URI;

    if (dbUrl) {
        // 支持 mysql:// 和 mysql+pymysql:// 两种格式（兼容旧配置）
        const normalizedUrl = dbUrl
            .replace('mysql+pymysql://', 'mysql://')
            .replace('mysql+mysqlconnector://', 'mysql://');
        return { uri: normalizedUrl };
    }

    // 从独立环境变量组装
    const host = process.env.MYSQL_HOST || 'localhost';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
    const user = process.env.MYSQL_USER || process.env.MYSQL_USERNAME || 'root';
    const password = process.env.MYSQL_PASSWORD || 'root';
    const database = process.env.MYSQL_DATABASE || 'exhibition';

    return { host, port, user, password, database };
}

// 使用连接池提高性能并避免连接耗尽
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
    if (!pool) {
        const config = getDbConfig();
        if ('uri' in config) {
            pool = mysql.createPool({ uri: config.uri, waitForConnections: true, connectionLimit: 10 });
        } else {
            pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10 });
        }
    }
    return pool;
}

export function getDb() {
    return getPool();
}

// ---- 数据库初始化（建表） ----

export async function initDb(): Promise<void> {
    const db = getPool();

    // 创建展览主表
    await db.execute(`
    CREATE TABLE IF NOT EXISTS exhibitions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title_en VARCHAR(255) NOT NULL,
      title_zh VARCHAR(255) NOT NULL,
      venue_en VARCHAR(255) NOT NULL,
      venue_zh VARCHAR(255) NOT NULL,
      continent VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      cover_image VARCHAR(500) NOT NULL DEFAULT '',
      price ENUM('free','paid') NOT NULL DEFAULT 'paid',
      status ENUM('recent','ending','longTerm') NOT NULL DEFAULT 'recent',
      description_en TEXT NULL,
      description_zh TEXT NULL,
      address_en VARCHAR(500) NOT NULL DEFAULT '',
      address_zh VARCHAR(500) NOT NULL DEFAULT '',
      hours_en VARCHAR(255) NOT NULL DEFAULT '',
      hours_zh VARCHAR(255) NOT NULL DEFAULT '',
      booking_url VARCHAR(500) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

    // 创建艺术家表
    await db.execute(`
    CREATE TABLE IF NOT EXISTS exhibition_artists (
      id INT PRIMARY KEY AUTO_INCREMENT,
      exhibition_id INT NOT NULL,
      artist_name VARCHAR(255) NOT NULL,
      FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

    // 创建图片表
    await db.execute(`
    CREATE TABLE IF NOT EXISTS exhibition_images (
      id INT PRIMARY KEY AUTO_INCREMENT,
      exhibition_id INT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

    // 创建管理员表
    await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) UNIQUE NOT NULL,
      hashed_password VARCHAR(255) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

    // 初始化管理员账号（幂等操作）
    await seedAdmin(db);

    // 创建场馆表
    await db.execute(`
    CREATE TABLE IF NOT EXISTS venues (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name_zh VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) NOT NULL DEFAULT '',
      continent VARCHAR(100) NOT NULL DEFAULT '',
      country VARCHAR(100) NOT NULL DEFAULT '',
      city VARCHAR(100) NOT NULL DEFAULT '',
      address_zh VARCHAR(500) NOT NULL DEFAULT '',
      address_en VARCHAR(500) NOT NULL DEFAULT '',
      hours_zh VARCHAR(255) NOT NULL DEFAULT '',
      hours_en VARCHAR(255) NOT NULL DEFAULT '',
      cover_image MEDIUMTEXT NOT NULL,
      description_zh TEXT,
      description_en TEXT,
      website VARCHAR(500) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

    // 自动数据库迁移（优先执行，保证后续操作字段正确）
    try {
        await db.execute('ALTER TABLE exhibitions ADD COLUMN booking_url VARCHAR(500) NOT NULL DEFAULT ""');
        console.log('Added booking_url column.');
    } catch { /* ignored if already exists */ }
    
    try {
        await db.execute('ALTER TABLE exhibitions DROP COLUMN transport_en');
        console.log('Dropped transport_en column.');
    } catch { /* ignored if not exists */ }

    try {
        await db.execute('ALTER TABLE exhibitions DROP COLUMN transport_zh');
        console.log('Dropped transport_zh column.');
    } catch { /* ignored if not exists */ }

    try {
        await db.execute('ALTER TABLE exhibitions MODIFY COLUMN cover_image MEDIUMTEXT NOT NULL');
        console.log('Modified cover_image to MEDIUMTEXT.');
    } catch { /* ignored */ }
    
    try {
        await db.execute('ALTER TABLE exhibition_images MODIFY COLUMN image_url MEDIUMTEXT NOT NULL');
        console.log('Modified image_url to MEDIUMTEXT.');
    } catch { /* ignored */ }

    // 展览表追加 view_count 和 venue_id 字段
    try {
        await db.execute('ALTER TABLE exhibitions ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0');
        console.log('Added view_count column.');
    } catch { /* ignored if already exists */ }

    try {
        await db.execute('ALTER TABLE exhibitions ADD COLUMN venue_id INT NULL');
        console.log('Added venue_id column.');
    } catch { /* ignored if already exists */ }

    // NOTE: 为展品图片追加介绍文字字段，TEXT 类型不加 DEFAULT（MySQL 严格模式限制）
    try {
        await db.execute('ALTER TABLE exhibition_images ADD COLUMN caption TEXT');
        console.log('Added caption column to exhibition_images.');
    } catch { /* ignored if already exists */ }

    // 初始化示例展览数据（如果为空）
    await seedExhibitions(db);
}

async function seedAdmin(db: mysql.Pool): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin888';

    const [rows] = await db.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM admins WHERE username = ?',
        [adminUsername]
    );

    if (rows.length === 0) {
        const hashed = await bcrypt.hash(adminPassword, 10);
        await db.execute(
            'INSERT INTO admins (username, hashed_password, is_active) VALUES (?, ?, 1)',
            [adminUsername, hashed]
        );
        console.log(`[DB] 已创建管理员账号: ${adminUsername}`);
    }
}

async function seedExhibitions(db: mysql.Pool): Promise<void> {
    const [rows] = await db.execute<mysql.RowDataPacket[]>('SELECT COUNT(*) as cnt FROM exhibitions');
    const count = (rows[0] as { cnt: number }).cnt;

    if (count > 0) return;

    const seedData = [
        {
            title_en: 'Van Gogh: The Immersive Experience', title_zh: '梵高：沉浸式体验',
            venue_en: 'Atelier des Lumières', venue_zh: '光之工坊',
            continent: 'Europe', country: 'France', city: 'Paris',
            start_date: '2026-01-15', end_date: '2026-06-30',
            cover_image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', price: 'paid', status: 'recent',
            description_en: 'Step into the paintings of Vincent van Gogh in this breathtaking immersive exhibition.',
            description_zh: '在这个令人惊叹的沉浸式展览中，走进文森特·梵高的画作。',
            address_en: '38 Rue Saint-Maur, 75011 Paris, France', address_zh: '法国巴黎圣莫尔街38号，邮编75011',
            hours_en: '10:00 - 18:00 (Closed on Tuesdays)', hours_zh: '10:00 - 18:00 (周二闭馆)',
            booking_url: 'https://atelier-lumieres.com/tickets',
            artists: ['Vincent van Gogh'], images: ['https://picsum.photos/800/600?random=11', 'https://picsum.photos/800/600?random=12'],
        },
        {
            title_en: 'Yayoi Kusama: Infinity Mirrors', title_zh: '草间弥生：无限镜像',
            venue_en: 'Tate Modern', venue_zh: '泰特现代美术馆',
            continent: 'Europe', country: 'UK', city: 'London',
            start_date: '2025-11-01', end_date: '2026-06-15',
            cover_image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', price: 'paid', status: 'ending',
            description_en: 'Experience the mesmerizing infinity mirror rooms by the legendary Japanese artist.',
            description_zh: '体验传奇日本艺术家令人着迷的无限镜像房间。',
            address_en: 'Bankside, London SE1 9TG, UK', address_zh: '英国伦敦河岸街 SE1 9TG',
            hours_en: '10:00 - 18:00', hours_zh: '10:00 - 18:00',
            booking_url: 'https://tate.org.uk/tickets',
            artists: ['Yayoi Kusama'], images: ['https://picsum.photos/800/600?random=21', 'https://picsum.photos/800/600?random=22'],
        },
        {
            title_en: 'Contemporary African Art', title_zh: '当代非洲艺术展',
            venue_en: 'Zeitz MOCAA', venue_zh: '蔡茨非洲当代艺术博物馆',
            continent: 'Africa', country: 'South Africa', city: 'Cape Town',
            start_date: '2024-01-01', end_date: '2028-12-31',
            cover_image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', price: 'free', status: 'longTerm',
            description_en: 'A comprehensive collection of contemporary art from Africa and its diaspora.',
            description_zh: '全面展示来自非洲及其侨民的当代艺术收藏。',
            address_en: 'V&A Waterfront, Silo District, Cape Town, 8001', address_zh: '开普敦 V&A 滨水区筒仓区',
            hours_en: '10:00 - 18:00 (Closed on Tuesdays)', hours_zh: '10:00 - 18:00 (周二闭馆)',
            booking_url: 'https://zeitzmocaa.museum/tickets',
            artists: ['Various Artists'], images: ['https://picsum.photos/800/600?random=31', 'https://picsum.photos/800/600?random=32'],
        },
        {
            title_en: 'Digital Renaissance', title_zh: '数字文艺复兴',
            venue_en: 'MoMA', venue_zh: '现代艺术博物馆',
            continent: 'North America', country: 'USA', city: 'New York',
            start_date: '2026-02-01', end_date: '2026-08-30',
            cover_image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', price: 'paid', status: 'recent',
            description_en: 'Exploring the intersection of classical art and modern digital mediums.',
            description_zh: '探索古典艺术与现代数字媒介的交汇。',
            address_en: '11 W 53rd St, New York, NY 10019, USA', address_zh: '美国纽约西53街11号，邮编10019',
            hours_en: '10:30 - 17:30', hours_zh: '10:30 - 17:30',
            booking_url: 'https://moma.org/tickets',
            artists: ['Refik Anadol', 'Beeple'], images: ['https://picsum.photos/800/600?random=41', 'https://picsum.photos/800/600?random=42'],
        },
        {
            title_en: 'The Art of Calligraphy', title_zh: '书法之美',
            venue_en: 'National Palace Museum', venue_zh: '国立故宫博物院',
            continent: 'Asia', country: 'Taiwan', city: 'Taipei',
            start_date: '2026-01-10', end_date: '2026-10-10',
            cover_image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', price: 'paid', status: 'recent',
            description_en: 'A journey through the history and evolution of Chinese calligraphy.',
            description_zh: '一段穿越中国书法历史与演变的旅程。',
            address_en: 'No. 221, Sec 2, Zhi Shan Rd, Shilin District, Taipei, 111', address_zh: '台湾台北市士林区至善路二段221号',
            hours_en: '09:00 - 17:00 (Closed on Mondays)', hours_zh: '09:00 - 17:00 (周一闭馆)',
            booking_url: 'https://npm.gov.tw/tickets',
            artists: ['Wang Xizhi', 'Yan Zhenqing'], images: ['https://picsum.photos/800/600?random=51', 'https://picsum.photos/800/600?random=52'],
        },
    ];

    for (const item of seedData) {
        const { artists, images, ...exhibitionData } = item;
        const insertQuery = `
      INSERT INTO exhibitions (title_en, title_zh, venue_en, venue_zh, continent, country, city, start_date, end_date, cover_image, price, status, description_en, description_zh, address_en, address_zh, hours_en, hours_zh, booking_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const [result] = await db.execute<mysql.ResultSetHeader>(
            insertQuery,
            [
                exhibitionData.title_en, exhibitionData.title_zh,
                exhibitionData.venue_en, exhibitionData.venue_zh,
                exhibitionData.continent, exhibitionData.country, exhibitionData.city,
                exhibitionData.start_date, exhibitionData.end_date,
                exhibitionData.cover_image, exhibitionData.price, exhibitionData.status,
                exhibitionData.description_en, exhibitionData.description_zh,
                exhibitionData.address_en, exhibitionData.address_zh,
                exhibitionData.hours_en, exhibitionData.hours_zh,
                exhibitionData.booking_url
            ]
        );
        const exhibitionId = result.insertId;

        for (const name of artists) {
            await db.execute('INSERT INTO exhibition_artists (exhibition_id, artist_name) VALUES (?, ?)', [exhibitionId, name]);
        }
        for (let i = 0; i < images.length; i++) {
            await db.execute('INSERT INTO exhibition_images (exhibition_id, image_url, sort_order) VALUES (?, ?, ?)', [exhibitionId, images[i], i]);
        }
    }

    console.log(`[DB] 已写入 ${seedData.length} 条示例展览数据`);
}
