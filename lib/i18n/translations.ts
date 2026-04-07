export const translations = {
  zh: {
    nav: {
      home: "首页",
      discover: "展览",
      trending: "热门",
      venues: "场馆",
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
      title: "展览",
      filter: "筛选",
      region: "地区",
      status: "状态",
      price: "票价",
      all: "全部",
      recent: "近期开展",
      ending: "即将结束",
      longTerm: "长期展览",
    },
    trending: {
      title: "热门展览",
      subtitle: "根据浏览量排名，发现最受关注的展览",
      empty: "暂无热门展览数据",
    },
    venues: {
      title: "场馆",
      subtitle: "探索全球顶级艺术场馆",
      filter: "按地区筛选",
      allRegions: "全部地区",
      exhibitions: "展览",
      viewAll: "查看全部展览",
      noVenues: "暂无场馆数据",
      noExhibitions: "该场馆暂无展览",
      website: "官网",
      hours: "开放时间",
      address: "地址",
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
      venue: "展览场馆",
    },
    footer: {
      copyright: "Copyright © 2026 Artwalk. All Rights Reserved.",
      contact: "Contact us：service@artwalk.cn",
    },
  }
};

export type Language = 'zh';
export type TranslationKey = keyof typeof translations.zh;
