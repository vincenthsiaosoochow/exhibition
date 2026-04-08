export interface Exhibition {
  id: string;
  title: {
    en: string;
    zh: string;
  };
  venue: {
    en: string;
    zh: string;
  };
  location: {
    continent: string;
    country: string;
    city: string;
  };
  startDate: string;
  endDate: string;
  coverImage: string;
  price: 'free' | 'paid';
  status: 'recent' | 'ending' | 'longTerm';
  description: {
    en: string;
    zh: string;
  };
  artists: string[];
  address: {
    en: string;
    zh: string;
  };
  hours: {
    en: string;
    zh: string;
  };
  bookingUrl: string;
  /** 展品图片列表，含图片 URL 和介绍文字 */
  images: { url: string; caption: string }[];
  viewCount: number;
  venueId?: number;
}

export interface Venue {
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
  description_zh: string;
  description_en: string;
  website: string;
}

// ---- 后端 API 响应类型（扁平结构）----

interface ApiExhibition {
  id: number;
  title_en: string;
  title_zh: string;
  venue_en: string;
  venue_zh: string;
  continent: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  cover_image: string;
  price: 'free' | 'paid';
  status: 'recent' | 'ending' | 'longTerm';
  description_en: string;
  description_zh: string;
  address_en: string;
  address_zh: string;
  hours_en: string;
  hours_zh: string;
  booking_url: string;
  view_count: number;
  venue_id?: number;
  artists: string[];
  images: { url: string; caption: string }[];
}

interface ApiListResponse {
  total: number;
  items: ApiExhibition[];
}

interface ApiVenueListResponse {
  total: number;
  items: Venue[];
}

/**
 * 将后端扁平结构转换为前端嵌套结构
 */
function toExhibition(api: ApiExhibition): Exhibition {
  return {
    id: String(api.id),
    title: { en: api.title_en, zh: api.title_zh },
    venue: { en: api.venue_en, zh: api.venue_zh },
    location: { continent: api.continent, country: api.country, city: api.city },
    startDate: api.start_date,
    endDate: api.end_date,
    coverImage: api.cover_image,
    price: api.price,
    status: api.status,
    description: { en: api.description_en, zh: api.description_zh },
    artists: api.artists,
    address: { en: api.address_en, zh: api.address_zh },
    hours: { en: api.hours_en, zh: api.hours_zh },
    bookingUrl: api.booking_url || '',
    images: api.images ?? [],
    viewCount: api.view_count || 0,
    venueId: api.venue_id,
  };
}

const getBaseUrl = () => {
    if (typeof window !== 'undefined') return ''; // 浏览器环境下使用相对路径，同源请求
    // 服务端组件需绝对路径。如果有环境变量则使用，否则回环请求本机
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    return `http://localhost:${process.env.PORT || 3000}`;
};

export interface FetchExhibitionsParams {
  search?: string;
  continent?: string;
  country?: string;
  city?: string;
  status?: string;
  price?: string;
  sortBy?: string;
  venueId?: number;
}

/**
 * 从后端获取展览列表，失败时抛出错误以便发现问题
 */
export async function fetchExhibitions(params?: FetchExhibitionsParams): Promise<Exhibition[]> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.continent && params.continent !== 'all') query.set('continent', params.continent);
    if (params?.country && params.country !== 'all') query.set('country', params.country);
    if (params?.city && params.city !== 'all') query.set('city', params.city);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.price && params.price !== 'all') query.set('price', params.price);
    if (params?.sortBy) query.set('sort_by', params.sortBy);
    if (params?.venueId) query.set('venue_id', String(params.venueId));

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/exhibitions${query.toString() ? `?${query}` : ''}`;
    const res = await fetch(url, {
        // NOTE: 60秒后重新验证，既能减轻数据库压力，又保证数据在1分钟内刷新
        next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data: ApiListResponse = await res.json();
    return data.items.map(toExhibition);
  } catch (err) {
    console.error('fetchExhibitions failed, returning mock data as fallback:', err);
    return mockExhibitions;
  }
}

/**
 * 从后端获取单个展览详情，失败时 fallback 到 mock 数据
 */
export async function fetchExhibitionById(id: string): Promise<Exhibition | undefined> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/exhibitions/${id}`, {
        // NOTE: 展览详情 30 秒刷新一次缓存
        next: { revalidate: 30 },
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data: ApiExhibition = await res.json();
    return toExhibition(data);
  } catch (err) {
    console.error(`fetchExhibitionById(${id}) failed, returning mock data as fallback:`, err);
    return mockExhibitions.find((e) => e.id === id);
  }
}

/**
 * 异步记录展览浏览量（非阻塞，失败静默处理）
 */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    await fetch(`/api/exhibitions/${id}/view`, { method: 'POST' });
  } catch {
    // 浏览量统计失败不影响用户体验，静默忽略
  }
}

/**
 * 获取场馆列表
 */
export async function fetchVenues(params?: { continent?: string; country?: string; city?: string; search?: string }): Promise<Venue[]> {
  try {
    const query = new URLSearchParams();
    if (params?.continent && params.continent !== 'all') query.set('continent', params.continent);
    if (params?.country && params.country !== 'all') query.set('country', params.country);
    if (params?.city && params.city !== 'all') query.set('city', params.city);
    if (params?.search) query.set('search', params.search);

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/venues${query.toString() ? `?${query}` : ''}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data: ApiVenueListResponse = await res.json();
    return data.items;
  } catch (err) {
    console.error('fetchVenues failed:', err);
    return [];
  }
}

/**
 * 获取单个场馆详情
 */
export async function fetchVenueById(id: number): Promise<Venue | undefined> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/venues/${id}`, { next: { revalidate: 60 } });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json() as Venue;
  } catch (err) {
    console.error(`fetchVenueById(${id}) failed:`, err);
    return undefined;
  }
}

export const mockExhibitions: Exhibition[] = [
  {
    id: '1',
    title: {
      en: 'Van Gogh: The Immersive Experience',
      zh: '梵高：沉浸式体验'
    },
    venue: {
      en: 'Atelier des Lumières',
      zh: '光之工坊'
    },
    location: {
      continent: 'Europe',
      country: 'France',
      city: 'Paris'
    },
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    coverImage: 'https://picsum.photos/800/600?random=1',
    price: 'paid',
    status: 'recent',
    description: {
      en: 'Step into the paintings of Vincent van Gogh in this breathtaking immersive exhibition.',
      zh: '在这个令人惊叹的沉浸式展览中，走进文森特·梵高的画作。'
    },
    artists: ['Vincent van Gogh'],
    address: {
      en: '38 Rue Saint-Maur, 75011 Paris, France',
      zh: '法国巴黎圣莫尔街38号，邮编75011'
    },
    hours: {
      en: 'Mon-Sun: 10:00 AM - 6:00 PM',
      zh: '周一至周日：上午 10:00 - 下午 6:00'
    },
    bookingUrl: 'https://atelier-lumieres.com/tickets',
    images: [
      { url: 'https://picsum.photos/800/600?random=11', caption: '' },
      { url: 'https://picsum.photos/800/600?random=12', caption: '' }
    ],
    viewCount: 0,
  },
  {
    id: '2',
    title: {
      en: 'Yayoi Kusama: Infinity Mirrors',
      zh: '草间弥生：无限镜像'
    },
    venue: {
      en: 'Tate Modern',
      zh: '泰特现代美术馆'
    },
    location: {
      continent: 'Europe',
      country: 'UK',
      city: 'London'
    },
    startDate: '2025-11-01',
    endDate: '2026-03-15',
    coverImage: 'https://picsum.photos/800/600?random=2',
    price: 'paid',
    status: 'ending',
    description: {
      en: 'Experience the mesmerizing infinity mirror rooms by the legendary Japanese artist.',
      zh: '体验传奇日本艺术家令人着迷的无限镜像房间。'
    },
    artists: ['Yayoi Kusama'],
    address: {
      en: 'Bankside, London SE1 9TG, UK',
      zh: '英国伦敦河岸街 SE1 9TG'
    },
    hours: {
      en: 'Mon-Sun: 10:00 AM - 6:00 PM',
      zh: '周一至周日：上午 10:00 - 下午 6:00'
    },
    bookingUrl: 'https://tate.org.uk/tickets',
    images: [
      { url: 'https://picsum.photos/800/600?random=21', caption: '' },
      { url: 'https://picsum.photos/800/600?random=22', caption: '' }
    ],
    viewCount: 0,
  },
  {
    id: '3',
    title: {
      en: 'Contemporary African Art',
      zh: '当代非洲艺术展'
    },
    venue: {
      en: 'Zeitz MOCAA',
      zh: '蔡茨非洲当代艺术博物馆'
    },
    location: {
      continent: 'Africa',
      country: 'South Africa',
      city: 'Cape Town'
    },
    startDate: '2024-01-01',
    endDate: '2028-12-31',
    coverImage: 'https://picsum.photos/800/600?random=3',
    price: 'free',
    status: 'longTerm',
    description: {
      en: 'A comprehensive collection of contemporary art from Africa and its diaspora.',
      zh: '全面展示来自非洲及其侨民的当代艺术收藏。'
    },
    artists: ['Various Artists'],
    address: {
      en: 'V&A Waterfront, Silo District, S Arm Rd, Waterfront, Cape Town, 8001',
      zh: '开普敦 V&A 滨水区筒仓区 S Arm 路 8001'
    },
    hours: {
      en: 'Tue-Sun: 10:00 AM - 6:00 PM',
      zh: '周二至周日：上午 10:00 - 下午 6:00'
    },
    bookingUrl: 'https://zeitzmocaa.museum/tickets',
    images: [
      { url: 'https://picsum.photos/800/600?random=31', caption: '' },
      { url: 'https://picsum.photos/800/600?random=32', caption: '' }
    ],
    viewCount: 0,
  },
  {
    id: '4',
    title: {
      en: 'Digital Renaissance',
      zh: '数字文艺复兴'
    },
    venue: {
      en: 'MoMA',
      zh: '现代艺术博物馆'
    },
    location: {
      continent: 'North America',
      country: 'USA',
      city: 'New York'
    },
    startDate: '2026-02-01',
    endDate: '2026-08-30',
    coverImage: 'https://picsum.photos/800/600?random=4',
    price: 'paid',
    status: 'recent',
    description: {
      en: 'Exploring the intersection of classical art and modern digital mediums.',
      zh: '探索古典艺术与现代数字媒介的交汇。'
    },
    artists: ['Refik Anadol', 'Beeple'],
    address: {
      en: '11 W 53rd St, New York, NY 10019, USA',
      zh: '美国纽约西53街11号，邮编10019'
    },
    hours: {
      en: 'Sun-Fri: 10:30 AM - 5:30 PM, Sat: 10:30 AM - 7:00 PM',
      zh: '周日至周五：上午 10:30 - 下午 5:30，周六：上午 10:30 - 晚上 7:00'
    },
    bookingUrl: 'https://www.moma.org/tickets/',
    images: [
      { url: 'https://picsum.photos/800/600?random=41', caption: '' },
      { url: 'https://picsum.photos/800/600?random=42', caption: '' }
    ],
    viewCount: 0,
  },
  {
    id: '5',
    title: {
      en: 'The Art of Calligraphy',
      zh: '书法之美'
    },
    venue: {
      en: 'National Palace Museum',
      zh: '国立故宫博物院'
    },
    location: {
      continent: 'Asia',
      country: 'Taiwan',
      city: 'Taipei'
    },
    startDate: '2026-01-10',
    endDate: '2026-04-10',
    coverImage: 'https://picsum.photos/800/600?random=5',
    price: 'paid',
    status: 'recent',
    description: {
      en: 'A journey through the history and evolution of Chinese calligraphy.',
      zh: '一段穿越中国书法历史与演变的旅程。'
    },
    artists: ['Wang Xizhi', 'Yan Zhenqing'],
    address: {
      en: 'No. 221, Sec 2, Zhi Shan Rd, Shilin District, Taipei City, Taiwan 111',
      zh: '台湾台北市士林区至善路二段221号 111'
    },
    hours: {
      en: 'Tue-Sun: 9:00 AM - 5:00 PM',
      zh: '周二至周日：上午 9:00 - 下午 5:00'
    },
    bookingUrl: 'https://npm.gov.tw/tickets',
    images: [
      { url: 'https://picsum.photos/800/600?random=51', caption: '' },
      { url: 'https://picsum.photos/800/600?random=52', caption: '' }
    ],
    viewCount: 0,
  }
];
