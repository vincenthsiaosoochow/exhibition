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
  transport: {
    en: string;
    zh: string;
  };
  images: string[];
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
  transport_en: string;
  transport_zh: string;
  artists: string[];
  images: string[];
}

interface ApiListResponse {
  total: number;
  items: ApiExhibition[];
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
    transport: { en: api.transport_en, zh: api.transport_zh },
    images: api.images,
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

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/exhibitions${query.toString() ? `?${query}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });

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
    const res = await fetch(`${baseUrl}/api/exhibitions/${id}`, { cache: 'no-store' });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data: ApiExhibition = await res.json();
    return toExhibition(data);
  } catch (err) {
    console.error(`fetchExhibitionById(${id}) failed, returning mock data as fallback:`, err);
    return mockExhibitions.find((e) => e.id === id);
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
    transport: {
      en: 'Metro Line 3 (Rue Saint-Maur)',
      zh: '地铁3号线 (Rue Saint-Maur)'
    },
    images: [
      'https://picsum.photos/800/600?random=11',
      'https://picsum.photos/800/600?random=12'
    ]
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
    transport: {
      en: 'Tube: Southwark or Blackfriars',
      zh: '地铁：Southwark 或 Blackfriars'
    },
    images: [
      'https://picsum.photos/800/600?random=21',
      'https://picsum.photos/800/600?random=22'
    ]
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
    transport: {
      en: 'MyCiTi Bus to Silo stop',
      zh: '乘坐 MyCiTi 巴士至 Silo 站'
    },
    images: [
      'https://picsum.photos/800/600?random=31',
      'https://picsum.photos/800/600?random=32'
    ]
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
    transport: {
      en: 'Subway E, M to 53rd St',
      zh: '地铁 E, M 线至 53 街'
    },
    images: [
      'https://picsum.photos/800/600?random=41',
      'https://picsum.photos/800/600?random=42'
    ]
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
    transport: {
      en: 'MRT Shilin Station, then bus R30',
      zh: '捷运士林站，转乘红30公交车'
    },
    images: [
      'https://picsum.photos/800/600?random=51',
      'https://picsum.photos/800/600?random=52'
    ]
  }
];
