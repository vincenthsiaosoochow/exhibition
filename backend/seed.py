"""
种子数据脚本：将前端 mock 数据写入 MySQL 数据库
运行方式：python -m backend.seed（在项目根目录下）
"""
import logging
import os
import sys

# 允许从项目根目录直接运行
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, init_db
from backend.models.exhibition import Exhibition, ExhibitionArtist, ExhibitionImage
from datetime import date

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED_DATA = [
    {
        "title_en": "Van Gogh: The Immersive Experience",
        "title_zh": "梵高：沉浸式体验",
        "venue_en": "Atelier des Lumières",
        "venue_zh": "光之工坊",
        "continent": "Europe",
        "country": "France",
        "city": "Paris",
        "start_date": date(2026, 1, 15),
        "end_date": date(2026, 6, 30),
        "cover_image": "https://picsum.photos/800/600?random=1",
        "price": "paid",
        "status": "recent",
        "description_en": "Step into the paintings of Vincent van Gogh in this breathtaking immersive exhibition.",
        "description_zh": "在这个令人惊叹的沉浸式展览中，走进文森特·梵高的画作。",
        "address_en": "38 Rue Saint-Maur, 75011 Paris, France",
        "address_zh": "法国巴黎圣莫尔街38号，邮编75011",
        "hours_en": "Mon-Sun: 10:00 AM - 6:00 PM",
        "hours_zh": "周一至周日：上午 10:00 - 下午 6:00",
        "transport_en": "Metro Line 3 (Rue Saint-Maur)",
        "transport_zh": "地铁3号线 (Rue Saint-Maur)",
        "artists": ["Vincent van Gogh"],
        "images": [
            "https://picsum.photos/800/600?random=11",
            "https://picsum.photos/800/600?random=12",
        ],
    },
    {
        "title_en": "Yayoi Kusama: Infinity Mirrors",
        "title_zh": "草间弥生：无限镜像",
        "venue_en": "Tate Modern",
        "venue_zh": "泰特现代美术馆",
        "continent": "Europe",
        "country": "UK",
        "city": "London",
        "start_date": date(2025, 11, 1),
        "end_date": date(2026, 3, 15),
        "cover_image": "https://picsum.photos/800/600?random=2",
        "price": "paid",
        "status": "ending",
        "description_en": "Experience the mesmerizing infinity mirror rooms by the legendary Japanese artist.",
        "description_zh": "体验传奇日本艺术家令人着迷的无限镜像房间。",
        "address_en": "Bankside, London SE1 9TG, UK",
        "address_zh": "英国伦敦河岸街 SE1 9TG",
        "hours_en": "Mon-Sun: 10:00 AM - 6:00 PM",
        "hours_zh": "周一至周日：上午 10:00 - 下午 6:00",
        "transport_en": "Tube: Southwark or Blackfriars",
        "transport_zh": "地铁：Southwark 或 Blackfriars",
        "artists": ["Yayoi Kusama"],
        "images": [
            "https://picsum.photos/800/600?random=21",
            "https://picsum.photos/800/600?random=22",
        ],
    },
    {
        "title_en": "Contemporary African Art",
        "title_zh": "当代非洲艺术展",
        "venue_en": "Zeitz MOCAA",
        "venue_zh": "蔡茨非洲当代艺术博物馆",
        "continent": "Africa",
        "country": "South Africa",
        "city": "Cape Town",
        "start_date": date(2024, 1, 1),
        "end_date": date(2028, 12, 31),
        "cover_image": "https://picsum.photos/800/600?random=3",
        "price": "free",
        "status": "longTerm",
        "description_en": "A comprehensive collection of contemporary art from Africa and its diaspora.",
        "description_zh": "全面展示来自非洲及其侨民的当代艺术收藏。",
        "address_en": "V&A Waterfront, Silo District, S Arm Rd, Waterfront, Cape Town, 8001",
        "address_zh": "开普敦 V&A 滨水区筒仓区 S Arm 路 8001",
        "hours_en": "Tue-Sun: 10:00 AM - 6:00 PM",
        "hours_zh": "周二至周日：上午 10:00 - 下午 6:00",
        "transport_en": "MyCiTi Bus to Silo stop",
        "transport_zh": "乘坐 MyCiTi 巴士至 Silo 站",
        "artists": ["Various Artists"],
        "images": [
            "https://picsum.photos/800/600?random=31",
            "https://picsum.photos/800/600?random=32",
        ],
    },
    {
        "title_en": "Digital Renaissance",
        "title_zh": "数字文艺复兴",
        "venue_en": "MoMA",
        "venue_zh": "现代艺术博物馆",
        "continent": "North America",
        "country": "USA",
        "city": "New York",
        "start_date": date(2026, 2, 1),
        "end_date": date(2026, 8, 30),
        "cover_image": "https://picsum.photos/800/600?random=4",
        "price": "paid",
        "status": "recent",
        "description_en": "Exploring the intersection of classical art and modern digital mediums.",
        "description_zh": "探索古典艺术与现代数字媒介的交汇。",
        "address_en": "11 W 53rd St, New York, NY 10019, USA",
        "address_zh": "美国纽约西53街11号，邮编10019",
        "hours_en": "Sun-Fri: 10:30 AM - 5:30 PM, Sat: 10:30 AM - 7:00 PM",
        "hours_zh": "周日至周五：上午 10:30 - 下午 5:30，周六：上午 10:30 - 晚上 7:00",
        "transport_en": "Subway E, M to 53rd St",
        "transport_zh": "地铁 E, M 线至 53 街",
        "artists": ["Refik Anadol", "Beeple"],
        "images": [
            "https://picsum.photos/800/600?random=41",
            "https://picsum.photos/800/600?random=42",
        ],
    },
    {
        "title_en": "The Art of Calligraphy",
        "title_zh": "书法之美",
        "venue_en": "National Palace Museum",
        "venue_zh": "国立故宫博物院",
        "continent": "Asia",
        "country": "Taiwan",
        "city": "Taipei",
        "start_date": date(2026, 1, 10),
        "end_date": date(2026, 4, 10),
        "cover_image": "https://picsum.photos/800/600?random=5",
        "price": "paid",
        "status": "recent",
        "description_en": "A journey through the history and evolution of Chinese calligraphy.",
        "description_zh": "一段穿越中国书法历史与演变的旅程。",
        "address_en": "No. 221, Sec 2, Zhi Shan Rd, Shilin District, Taipei City, Taiwan 111",
        "address_zh": "台湾台北市士林区至善路二段221号 111",
        "hours_en": "Tue-Sun: 9:00 AM - 5:00 PM",
        "hours_zh": "周二至周日：上午 9:00 - 下午 5:00",
        "transport_en": "MRT Shilin Station, then bus R30",
        "transport_zh": "捷运士林站，转乘红30公交车",
        "artists": ["Wang Xizhi", "Yan Zhenqing"],
        "images": [
            "https://picsum.photos/800/600?random=51",
            "https://picsum.photos/800/600?random=52",
        ],
    },
]


def seed():
    """
    初始化数据库表并写入种子数据（幂等：跳过已存在的数据）
    """
    init_db()

    # 引入 auth_service
    from backend.service.auth_service import hash_password
    from backend.models.admin import Admin

    db = SessionLocal()
    try:
        # 1. 初始化默认管理员
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin888")
        
        admin = db.query(Admin).filter(Admin.username == admin_username).first()
        if not admin:
            hashed = hash_password(admin_password)
            new_admin = Admin(username=admin_username, hashed_password=hashed)
            db.add(new_admin)
            db.commit()
            logger.info(f"成功创建默认管理员账号: {admin_username}")
        else:
            logger.info(f"管理员账号 {admin_username} 已存在")

        # 2. 初始化展览数据
        existing_count = db.query(Exhibition).count()
        if existing_count > 0:
            logger.info(f"数据库中已存在 {existing_count} 条展览数据，跳过种子初始化")
            return

        for data in SEED_DATA:
            artists = data.pop("artists", [])
            images = data.pop("images", [])

            exhibition = Exhibition(**data)
            db.add(exhibition)
            db.flush()  # 获取自增 ID

            for name in artists:
                db.add(ExhibitionArtist(exhibition_id=exhibition.id, artist_name=name))

            for idx, url in enumerate(images):
                db.add(ExhibitionImage(exhibition_id=exhibition.id, image_url=url, sort_order=idx))

        db.commit()
        logger.info(f"成功写入 {len(SEED_DATA)} 条展览种子数据")
    except Exception as e:
        db.rollback()
        logger.error(f"种子数据写入失败：{e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()

