/**
 * 播种 BI 中台真实演示数据到 MongoDB（dashboard_cache 集合）
 *
 * 数据以真实文档形式存入 MongoDB，由 /api/v1/dashboard/* 接口读取返回，
 * 使前端 BI 中台从「Mock 兜底」切换为「真实后端取数」。
 *
 * 用法：node scripts/seedDashboard.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zhongfangtang';

const DashboardCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },
});
const DashboardCache = mongoose.models.DashboardCache ||
  mongoose.model('DashboardCache', DashboardCacheSchema);

// ============ 与前端 api.js Mock 同结构（真实文档存库） ============

function getMockOverview() {
  return {
    totalExposure: 2856000, totalAcquisition: 12580, totalConversion: 3620,
    totalRevenue: 1865000, roi: 3.85,
    exposureGrowth: 12.5, acquisitionGrowth: 8.3, conversionGrowth: 15.2,
    revenueGrowth: 22.1, roiGrowth: 5.6,
  };
}

function getMockPlatformData() {
  return [
    { platform: '抖音', icon: '📱', followers: 285000, contentCount: 860, exposure: 1250000, plays: 980000, likes: 156000, comments: 32000, shares: 18000, referrals: 5200, acquisition: 4850, intentRate: 42.5, conversion: 1680, revenue: 685000 },
    { platform: '小红书', icon: '📕', followers: 168000, contentCount: 520, exposure: 680000, plays: 0, likes: 89000, comments: 21000, shares: 12000, referrals: 3100, acquisition: 2850, intentRate: 38.2, conversion: 920, revenue: 425000 },
    { platform: '视频号', icon: '🎥', followers: 125000, contentCount: 380, exposure: 420000, plays: 350000, likes: 45000, comments: 12000, shares: 8500, referrals: 1800, acquisition: 1650, intentRate: 35.8, conversion: 480, revenue: 285000 },
    { platform: '公众号', icon: '📰', followers: 95000, contentCount: 240, exposure: 280000, plays: 0, likes: 12000, comments: 3500, shares: 5000, referrals: 1200, acquisition: 980, intentRate: 45.2, conversion: 320, revenue: 220000 },
    { platform: '快手', icon: '⚡', followers: 158000, contentCount: 450, exposure: 380000, plays: 290000, likes: 52000, comments: 15000, shares: 9500, referrals: 1600, acquisition: 1420, intentRate: 30.5, conversion: 350, revenue: 165000 },
    { platform: 'B站', icon: '📺', followers: 62000, contentCount: 180, exposure: 156000, plays: 125000, likes: 28000, comments: 8500, shares: 4200, referrals: 680, acquisition: 520, intentRate: 28.6, conversion: 120, revenue: 85000 },
  ];
}

function getMockFunnel() {
  return { stages: ['曝光', '点击', '互动', '留资', '成交'], values: [2856000, 852000, 356000, 28500, 3620], rates: [100, 29.8, 41.8, 8.0, 12.7] };
}

function getMockTrend() {
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    days.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  const exp = [], inter = [], conv = [];
  for (let i = 0; i < 30; i++) {
    exp.push(60000 + Math.round(40000 * Math.abs(Math.sin(i * 0.7))));
    inter.push(5000 + Math.round(8000 * Math.abs(Math.cos(i * 0.5))));
    conv.push(60 + Math.round(120 * Math.abs(Math.sin(i * 0.9))));
  }
  return { labels: days, datasets: { exposure: exp, interaction: inter, conversion: conv } };
}

function getMockChannel() {
  return [
    { name: '抖音短视频', value: 38.5, color: '#d4a853' },
    { name: '小红书笔记', value: 22.8, color: '#e8c97a' },
    { name: '视频号直播', value: 15.2, color: '#f0d9a0' },
    { name: '公众号文章', value: 8.6, color: '#c9953e' },
    { name: '快手短视频', value: 9.5, color: '#b8862d' },
    { name: 'B站视频', value: 5.4, color: '#a07028' },
  ];
}

function getMockUserProfile() {
  return {
    age: [{ label: '18-25岁', value: 12 }, { label: '26-35岁', value: 35 }, { label: '36-45岁', value: 32 }, { label: '46-55岁', value: 16 }, { label: '55岁以上', value: 5 }],
    demand: [{ label: '瘦身塑形', value: 28 }, { label: '面部护理', value: 25 }, { label: '亚健康调理', value: 22 }, { label: '肩颈舒缓', value: 15 }, { label: '产后修复', value: 10 }],
    consumption: [{ label: '低消费(＜500)', value: 18 }, { label: '中消费(500-2000)', value: 42 }, { label: '高消费(2000-5000)', value: 28 }, { label: '超高消费(＞5000)', value: 12 }],
    region: [{ name: '广东', value: 22 }, { name: '浙江', value: 15 }, { name: '江苏', value: 13 }, { name: '北京', value: 10 }, { name: '上海', value: 9 }, { name: '四川', value: 8 }, { name: '湖北', value: 7 }, { name: '山东', value: 6 }, { name: '其他', value: 10 }],
    radar: { labels: ['消费能力', '健康意识', '品牌忠诚', '社交活跃', '内容偏好', '购买决策'], values: [82, 78, 65, 72, 88, 58] },
  };
}

function getMockPrivateDomain() {
  return {
    totalMembers: 48500, newMembers: 1280, retentionRate: 72.5, activeRate: 45.8,
    groups: [
      { name: 'VIP会员群', count: 8500, active: 5200, conversion: 38.5 },
      { name: '体验福利群', count: 12500, active: 6800, conversion: 22.3 },
      { name: '知识分享群', count: 9500, active: 4500, conversion: 18.6 },
      { name: '直播粉丝群', count: 10800, active: 5800, conversion: 25.8 },
      { name: '区域客户群', count: 7200, active: 3200, conversion: 32.1 },
    ],
    dailyNewMembers: [140, 165, 120, 180, 155, 200, 320],
    dailyActive: [19000, 21000, 20500, 22000, 21500, 23000, 24000],
  };
}

function getMockReport(period) {
  const reports = {
    day: { title: '每日数据复盘', summary: '今日整体数据表现良好，抖音渠道曝光量环比增长15%，获客成本控制在预算范围内。私域社群活跃度维持在45%以上，转化率稳步提升。建议加大晚间19:00-21:00时段内容发布密度。', highlights: ['抖音视频《精油按摩教程》播放量突破50万', '小红书爆款笔记引流新增800+私域用户', '单日成交额突破6.8万元，创本月新高'], warnings: ['快手渠道互动率略有下降，建议优化内容方向', 'B站视频互动率偏低，需调整内容策略'] },
    week: { title: '周度数据复盘', summary: '本周整体运营数据呈上升趋势，六大平台总曝光量突破650万，新增私域用户3800+，成交额环比增长18%。抖音持续领跑，小红书种草效果显著。视频号直播场次增加带动了整体获客效率提升。', highlights: ['周总曝光量650万+，环比增长12%', '私域社群新增3800人，留存率72.5%', '直播带货成交额突破15万元', 'AI智能客服自动回复率达65%'], warnings: ['个别时段客服响应时间偏长', '部分区域客户群活跃度不足'] },
    month: { title: '月度数据复盘', summary: '本月全域运营成果显著，总曝光量突破2800万，获客12580人，成交额186.5万元，ROI达到3.85。AI智能体系统在内容生成、客户应答、数据分析等方面发挥了重要作用。下月计划加大直播投入，优化AI话术模型。', highlights: ['月度GMV突破186万元，同比增长35%', 'AI内容生成效率提升60%，人工成本下降40%', '私域流量池总人数达4.85万人', '用户复购率提升至28%'], warnings: ['部分渠道获客成本有所上升', 'B站渠道投入产出比需优化'] },
  };
  return reports[period] || reports.day;
}

function getMockGEO() {
  return {
    totalImpressions: 456800, avgRank: 3.8, ctr: 8.5, geoScore: 87, optimizedContents: 156,
    rankingTrend: { labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], datasets: [
      { label: '宜昌精油芳疗', data: [3, 2, 3, 2, 1, 2, 1], borderColor: '#d4a853', tension: 0.3, fill: false },
      { label: '宜昌体质调理', data: [5, 4, 3, 4, 3, 2, 2], borderColor: '#5B8C5A', tension: 0.3, fill: false },
      { label: '宜昌美容SPA', data: [8, 7, 6, 7, 5, 6, 5], borderColor: '#5B7FBD', tension: 0.3, fill: false },
    ] },
    platformDistribution: { labels: ['百度搜索', '抖音搜索', '小红书搜索', '微信搜一搜', 'B站搜索'], values: [35, 28, 20, 12, 5] },
    keywords: [
      { rank: 1, keyword: '宜昌精油芳疗', change: 1 }, { rank: 2, keyword: '宜昌体质调理', change: 2 },
      { rank: 3, keyword: '中芳堂精油', change: 0 }, { rank: 4, keyword: '宜昌SPA推荐', change: -1 },
      { rank: 5, keyword: '中医芳香疗法', change: 3 }, { rank: 6, keyword: '伍家岗美容院', change: 0 },
      { rank: 7, keyword: '九体辨识调理', change: 2 }, { rank: 8, keyword: '宜昌养生馆', change: -2 },
      { rank: 9, keyword: '精油按摩宜昌', change: 1 }, { rank: 10, keyword: '腕家H1手表', change: 4 },
    ],
  };
}

async function main() {
  await mongoose.connect(uri);
  console.log('MongoDB 连接成功，开始播种 BI 中台数据…');
  const docs = [
    { key: 'overview', data: getMockOverview() },
    { key: 'platform-data', data: getMockPlatformData() },
    { key: 'funnel', data: getMockFunnel() },
    { key: 'trend', data: getMockTrend() },
    { key: 'channel', data: getMockChannel() },
    { key: 'user-profile', data: getMockUserProfile() },
    { key: 'private-domain', data: getMockPrivateDomain() },
    { key: 'report_day', data: getMockReport('day') },
    { key: 'report_week', data: getMockReport('week') },
    { key: 'report_month', data: getMockReport('month') },
    { key: 'geo', data: getMockGEO() },
  ];
  for (const d of docs) {
    await DashboardCache.updateOne({ key: d.key }, { $set: { data: d.data, updatedAt: new Date() } }, { upsert: true });
    console.log('  ✓', d.key);
  }
  console.log(`\n完成：${docs.length} 条 BI 中台数据已写入 MongoDB（dashboard_cache）。`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('播种失败:', e); process.exit(1); });
