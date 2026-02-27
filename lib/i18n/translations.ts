export const translations = {
  zh: {
    nav: {
      home: "首页",
      discover: "发现",
      map: "地图",
      search: "搜索展览、艺术家、场馆...",
    },
    common: {
      loading: "加载中...",
      offline: "当前为离线模式，显示缓存数据。",
      error: "网络似乎去火星看展了，请重试。",
      retry: "刷新重试",
      free: "免费",
      paid: "付费",
      share: "分享",
      copyAddress: "复制地址",
      copied: "已复制！",
      noResults: "未找到相关结果。",
    },
    home: {
      trending: "热门展览",
      endingSoon: "近期即将结束",
      localRecommendations: "同地区推荐",
    },
    discover: {
      title: "发现",
      filter: "筛选",
      region: "地区",
      status: "状态",
      price: "票价",
      all: "全部",
      recent: "近期开展",
      ending: "即将结束",
      longTerm: "长期展览",
    },
    details: {
      about: "展览简介",
      highlights: "核心展品",
      artists: "参展艺术家",
      practicalInfo: "实用信息",
      address: "详细地址",
      hours: "开放时间",
      transport: "交通指南",
      bookNow: "立即预约",
    }
  }
};

export type Language = 'zh';
export type TranslationKey = keyof typeof translations.zh;
