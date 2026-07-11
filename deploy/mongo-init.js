/**
 * 中芳堂AI系统 - MongoDB 初始化脚本
 *
 * Docker 首次启动时自动执行，创建数据库和集合索引。
 *
 * 使用方式：
 *   docker compose up -d (自动执行)
 *   或手动：mongosh < /docker-entrypoint-initdb.d/init.js
 */

// 切换到目标数据库
db = db.getSiblingDB('zhongfangtang');

// ==================== 集合与索引 ====================

// 1. 平台账号
db.createCollection('platforms');
db.platforms.createIndex({ platform: 1, accountId: 1 }, { unique: true });
db.platforms.createIndex({ status: 1 });

// 2. 发布内容
db.createCollection('contents');
db.contents.createIndex({ platform: 1, status: 1, createdAt: -1 });
db.contents.createIndex({ publishTime: -1 });
db.contents.createIndex({ aiGenerated: 1 });

// 3. 发布日志
db.createCollection('publish_logs');
db.publish_logs.createIndex({ contentId: 1, platform: 1 });
db.publish_logs.createIndex({ createdAt: -1 });
db.publish_logs.createIndex({ status: 1 });

// 4. 截流线索
db.createCollection('interception_leads');
db.interception_leads.createIndex({ platform: 1, status: 1 });
db.interception_leads.createIndex({ intentScore: -1 });
db.interception_leads.createIndex({ createdAt: -1 });
db.interception_leads.createIndex({ keyword: 1 });

// 5. 截流互动记录
db.createCollection('interception_logs');
db.interception_logs.createIndex({ leadId: 1 });
db.interception_logs.createIndex({ createdAt: -1 });
db.interception_logs.createIndex({ platform: 1, action: 1 });

// 6. 客户信息 (CRM)
db.createCollection('customers');
db.customers.createIndex({ weworkId: 1 }, { unique: true, sparse: true });
db.customers.createIndex({ phone: 1 }, { sparse: true });
db.customers.createIndex({ tier: 1, status: 1 });
db.customers.createIndex({ source: 1, createdAt: -1 });
db.customers.createIndex({ lastContactAt: -1 });

// 7. 跟进记录
db.createCollection('follow_ups');
db.follow_ups.createIndex({ customerId: 1, createdAt: -1 });
db.follow_ups.createIndex({ type: 1, status: 1 });
db.follow_ups.createIndex({ scheduledAt: 1, status: 1 });

// 8. 交易/订单
db.createCollection('transactions');
db.transactions.createIndex({ customerId: 1, createdAt: -1 });
db.transactions.createIndex({ type: 1, status: 1 });
db.transactions.createIndex({ amount: 1 });

// 9. 数据分析快照
db.createCollection('analytics_snapshots');
db.analytics_snapshots.createIndex({ date: -1, type: 1 }, { unique: true });
db.analytics_snapshots.createIndex({ platform: 1, date: -1 });

// 10. GEO 搜索排名
db.createCollection('geo_rankings');
db.geo_rankings.createIndex({ keyword: 1, platform: 1, date: -1 });
db.geo_rankings.createIndex({ date: -1 });

// 11. 系统配置
db.createCollection('system_configs');
db.system_configs.createIndex({ key: 1 }, { unique: true });

// 12. 定时任务日志
db.createCollection('cron_logs');
db.cron_logs.createIndex({ taskName: 1, executedAt: -1 });
db.cron_logs.createIndex({ status: 1 });

// ==================== 默认配置数据 ====================

// 插入默认系统配置
db.system_configs.insertMany([
  {
    key: 'content.default_tags',
    value: ['中医芳疗', '精油养生', '体质调理', '中芳堂', '宜昌美容'],
    description: '内容发布默认标签',
    updatedAt: new Date(),
  },
  {
    key: 'interception.enabled',
    value: true,
    description: '截流引擎开关',
    updatedAt: new Date(),
  },
  {
    key: 'private_domain.auto_follow_up',
    value: true,
    description: '私域自动跟进开关',
    updatedAt: new Date(),
  },
]);

print('✅ 中芳堂数据库初始化完成！');
print(`   数据库: zhongfangtang`);
print(`   集合数: 12`);
print(`   索引: 已创建`);
