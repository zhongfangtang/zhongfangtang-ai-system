# 中芳堂全域AI智能体系统 - 数据同步规格说明

> 版本：1.0.0 | 更新日期：2026-07-11 | 负责Agent：erp-agent（ERP同步官·小芳管家）

---

## 一、系统架构概述

### 1.1 数据同步拓扑

```
                    ┌──────────────┐
                    │  CloudBase   │
                    │  (核心数据库) │
                    └──────┬───────┘
                           │
           ┌───────────────┼────���──────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
    │  微信小程序  │ │ 全域AI智能体 │ │  企业微信   │
    │  zft-v102   │ │  Agent集群  │ │   客户联系   │
    └──────┬──────┘ └─────┬──────┘ └─────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼───────┐
                    │   ERP Agent  │
                    │ (双向同步中间件)│
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
    │  门店ERP系统 │ │  收银POS   │ │  第三方系统  │
    │ (待对接)     │ │ (待对接)    │ │ (预留扩展)  │
    └─────────────┘ └────────────┘ └────────────┘
```

### 1.2 同步原则

| 原则 | 说明 |
|------|------|
| 实时性 | 核心数据（客户/订单/库存）实时同步，延迟≤5秒 |
| 最终一致性 | 非核心数据采用准实时同步，延迟≤5分钟 |
| 双向同步 | CloudBase ↔ ERP/POS 双向数据流动 |
| 冲突解决 | 以最后修改时间戳为准，特殊实体以ERP为准 |
| 数据安全 | 敏感字段加密传输，传输层TLS 1.3 |
| 可追溯 | 所有同步操作记录日志，保留90天 |
| 高可用 | 同步失败自动重试3次，降级策略保底 |

---

## 二、CRM客户数据模型

### 2.1 核心实体关系图

```
Customer (客户)
  ├── 1:N → MemberCard (会员卡)
  ├── 1:N → Order (订单)
  ├── 1:N → ServiceRecord (服务记录)
  ├── 1:N → TizhiAssessment (体质测评记录)
  ├── 1:N → CouponRecord (优惠券记录)
  ├── 1:N → FollowupLog (跟进记录)
  ├── 1:N → WatchData (腕家H1数据)
  └── 1:N → InteractionLog (全域互动记录)

Product (产品)
  ├── 1:N → OrderItem (订单明细)
  └── 1:N → InventoryRecord (库存记录)

Staff (员工)
  ├── 1:N → ServiceRecord (服务记录)
  └── 1:N → PerformanceRecord (绩效记录)
```

### 2.2 Customer 客户模型

```json
{
  "customer_id": "C2026071100001",
  "basic_info": {
    "name": "张三",
    "name_pinyin": "Zhang San",
    "phone": "138****5678",
    "phone_encrypted": "AES256-encrypted-value",
    "gender": "female",
    "birthday": "1990-05-15",
    "age_group": "30-35",
    "wechat_openid": "wx_openid_xxx",
    "wechat_unionid": "wx_unionid_xxx",
    "wecom_external_userid": "wm_xxx",
    "douyin_openid": "dy_xxx",
    "avatar_url": "https://xxx/avatar.jpg"
  },
  "tizhi_profile": {
    "primary_type": "痰湿体质",
    "secondary_types": ["湿热倾向"],
    "assessment_count": 3,
    "last_assessment_time": "2026-07-10T14:30:00Z",
    "assessment_confidence": 0.85,
    "key_symptoms": ["身体沉重", "面部油腻", "舌苔厚腻", "腹部肥胖"],
    "facial_features": {
      "forehead": "油脂分泌旺盛",
      "nose": "毛孔粗大",
      "cheeks": "色斑沉着",
      "jaw": "反复痤疮"
    },
    "tongue_features": {
      "body": "胖大",
      "coating": "厚腻偏黄",
      "teeth_marks": "轻微齿痕"
    }
  },
  "watch_data_summary": {
    "avg_heart_rate": 72,
    "avg_spo2": 97,
    "sleep_quality_score": 65,
    "stress_index": "中等",
    "avg_temperature": 36.4,
    "last_sync_time": "2026-07-11T08:00:00Z"
  },
  "customer_level": {
    "level": "B",
    "level_name": "B类远程客户",
    "level_reason": "已完成体质测评但未到店",
    "level_updated_at": "2026-07-01T10:00:00Z",
    "rfm_score": {
      "recency": 7,
      "frequency": 0,
      "monetary": 0
    }
  },
  "source": {
    "primary_channel": "抖音",
    "secondary_channel": "评论区截流",
    "utm_source": "douyin",
    "utm_medium": "comment",
    "utm_campaign": "tizhi_flow",
    "first_touch_time": "2026-07-01T09:30:00Z",
    "referrer_id": null
  },
  "tags": [
    "痰湿体质", "敏感肌", "减肥需求", "关注精油", "宜昌本地",
    "意向到店", "已测体质", "领券未用"
  ],
  "status": {
    "is_active": true,
    "is_wecom_contact": false,
    "silent_days": 0,
    "last_interaction_time": "2026-07-11T09:00:00Z",
    "last_visit_time": null,
    "churn_risk": 0.15,
    "churn_risk_level": "low"
  },
  "consent": {
    "privacy_agreed": true,
    "privacy_agreed_time": "2026-07-01T09:30:00Z",
    "marketing_consent": true,
    "data_usage_consent": true,
    "consent_version": "v2.0"
  },
  "metadata": {
    "created_at": "2026-07-01T09:30:00Z",
    "updated_at": "2026-07-11T09:00:00Z",
    "created_by": "interception-agent",
    "data_source": "cloudbase"
  }
}
```

### 2.3 MemberCard 会员卡模型

```json
{
  "card_id": "MC2026071100001",
  "customer_id": "C2026071100001",
  "card_type": "storage",
  "card_type_name": "储值卡",
  "balance": 2000.00,
  "total_charged": 3000.00,
  "total_consumed": 1000.00,
  "points": 1500,
  "level": "silver",
  "level_name": "银卡会员",
  "discount_rate": 0.9,
  "issued_date": "2026-07-10",
  "expiry_date": "2027-07-10",
  "status": "active",
  "transactions": [
    {
      "id": "T20260710001",
      "type": "recharge",
      "amount": 3000.00,
      "time": "2026-07-10T15:00:00Z"
    }
  ],
  "metadata": {
    "created_at": "2026-07-10T15:00:00Z",
    "updated_at": "2026-07-10T15:00:00Z"
  }
}
```

### 2.4 Order 订单模型

```json
{
  "order_id": "O2026071100001",
  "customer_id": "C2026071100001",
  "order_type": "service",
  "order_type_name": "到店服务",
  "items": [
    {
      "sku": "SV001",
      "name": "九体辨识精油全身调理",
      "category": "体质调理",
      "quantity": 1,
      "unit_price": 298.00,
      "discount": 0.0,
      "actual_price": 149.00,
      "coupon_id": "CP20260710001",
      "staff_id": "S001",
      "staff_name": "屈兵",
      "duration_minutes": 90
    }
  ],
  "subtotal": 298.00,
  "discount_total": 149.00,
  "coupon_discount": 149.00,
  "final_amount": 149.00,
  "payment_method": "member_card",
  "payment_status": "paid",
  "order_status": "completed",
  "appointment_time": "2026-07-11T14:00:00Z",
  "service_start_time": "2026-07-11T14:05:00Z",
  "service_end_time": "2026-07-11T15:35:00Z",
  "satisfaction_score": 5,
  "feedback": "体验很好，屈老师手法专业",
  "source": "miniprogram",
  "metadata": {
    "created_at": "2026-07-10T16:00:00Z",
    "updated_at": "2026-07-11T15:40:00Z"
  }
}
```

### 2.5 Product 产品模型

```json
{
  "sku": "EO-TZ-001",
  "name": "痰湿体质复方精油",
  "name_short": "申化祛湿精油",
  "category": "essential_oil",
  "sub_category": "compound_oil",
  "brand": "中芳堂",
  "description": "针对痰湿体质调配的复方精油，含广藿香、苍术、陈皮等精油成分",
  "spec": {
    "volume_ml": 10,
    "concentration": "5%",
    "dilution_base": "荷荷巴油"
  },
  "pricing": {
    "retail_price": 198.00,
    "member_price": 178.00,
    "vip_price": 158.00,
    "cost_price": 68.00
  },
  "inventory": {
    "current_stock": 45,
    "min_stock_alert": 10,
    "max_stock": 100,
    "unit": "瓶",
    "warehouse_location": "A-03-12"
  },
  "tizhi_mapping": {
    "primary_tizhi": "痰湿体质",
    "suitable_for": ["痰湿体质", "湿热体质"],
    "caution_for": ["阴虚体质"],
    "contraindication": ["孕妇", "精油过敏者"]
  },
  "usage_instructions": {
    "method": "外用按摩",
    "frequency": "每日1-2次",
    "body_parts": ["腹部", "腰部", "大腿"],
    "warnings": ["稀释后使用", "避开眼周", "皮肤测试后使用"]
  },
  "status": "on_sale",
  "metadata": {
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-07-01T00:00:00Z"
  }
}
```

---

## 三、ERP/收银系统对接接口规范

### 3.1 接口总览

| 接口分组 | 接口路径 | 方法 | 方向 | 说明 |
|---------|---------|------|------|------|
| 客户同步 | `/api/v1/customer/sync` | POST | 双向 | 客户数据同步 |
| 会员卡同步 | `/api/v1/member-card/sync` | POST | 双向 | 会员卡数据同步 |
| 订单同步 | `/api/v1/order/sync` | POST | 双向 | 订单数据同步 |
| 产品同步 | `/api/v1/product/sync` | POST | ERP→CloudBase | 产品信息同步 |
| 库存同步 | `/api/v1/inventory/sync` | POST | 双向 | 库存数据同步 |
| 服务记录同步 | `/api/v1/service-record/sync` | POST | ERP→CloudBase | 服务记录同步 |
| 员工同步 | `/api/v1/staff/sync` | POST | ERP→CloudBase | 员工信息同步 |
| 对账接口 | `/api/v1/reconciliation` | POST | 双向 | 每日对账 |
| 健康检查 | `/api/v1/health` | GET | 双向 | 系统健康检查 |

### 3.2 通用请求规范

```json
{
  "header": {
    "api_version": "v1",
    "app_id": "zhongfangtang-ai",
    "timestamp": "2026-07-11T10:00:00Z",
    "request_id": "req-uuid-v4",
    "signature": "HMAC-SHA256(secret, body+timestamp+request_id)"
  },
  "body": {
    "sync_type": "incremental",
    "sync_batch_id": "batch-uuid-v4",
    "entities": [],
    "last_sync_token": "sync-token-from-previous"
  }
}
```

### 3.3 客户同步接口

```
POST /api/v1/customer/sync

Request:
{
  "sync_type": "incremental",
  "entities": [
    {
      "action": "upsert",
      "customer_id": "C2026071100001",
      "phone_encrypted": "AES256...",
      "name_encrypted": "AES256...",
      "gender": "female",
      "birthday": "1990-05-15",
      "tags": ["痰湿体质", "B类远程客户"],
      "source": "douyin",
      "updated_at": "2026-07-11T09:00:00Z"
    }
  ]
}

Response:
{
  "code": 0,
  "message": "success",
  "data": {
    "synced_count": 1,
    "failed_count": 0,
    "conflicts": [],
    "new_sync_token": "token-after-this-sync"
  }
}
```

### 3.4 订单同步接口

```
POST /api/v1/order/sync

Request:
{
  "sync_type": "incremental",
  "entities": [
    {
      "action": "create",
      "order_id": "O2026071100001",
      "customer_id": "C2026071100001",
      "order_type": "service",
      "items": [
        {
          "sku": "SV001",
          "name": "九体辨识精油全身调理",
          "quantity": 1,
          "unit_price": 298.00,
          "actual_price": 149.00,
          "coupon_id": "CP20260710001",
          "staff_id": "S001"
        }
      ],
      "final_amount": 149.00,
      "payment_method": "member_card",
      "payment_status": "paid",
      "order_status": "completed",
      "source": "miniprogram",
      "created_at": "2026-07-10T16:00:00Z"
    }
  ]
}

Response:
{
  "code": 0,
  "message": "success",
  "data": {
    "synced_count": 1,
    "failed_count": 0,
    "erp_order_id": "ERP-O-202607110001"
  }
}
```

### 3.5 库存同步接口

```
POST /api/v1/inventory/sync

Request:
{
  "sync_type": "full",
  "entities": [
    {
      "sku": "EO-TZ-001",
      "current_stock": 45,
      "sold_today": 3,
      "sold_this_week": 12,
      "warehouse_location": "A-03-12",
      "updated_at": "2026-07-11T09:00:00Z"
    }
  ]
}

Response:
{
  "code": 0,
  "message": "success",
  "data": {
    "synced_count": 1,
    "low_stock_alerts": [
      {
        "sku": "EO-TX-003",
        "current_stock": 5,
        "min_stock": 10,
        "suggestion": "建议补货至少5瓶"
      }
    ]
  }
}
```

### 3.6 对账接口

```
POST /api/v1/reconciliation

Request:
{
  "date": "2026-07-10",
  "entities": ["customer", "order", "member_card", "inventory"],
  "summary": {
    "total_orders": 15,
    "total_amount": 4580.00,
    "new_customers": 8,
    "card_recharges": 12000.00,
    "card_consumptions": 3580.00
  }
}

Response:
{
  "code": 0,
  "message": "success",
  "data": {
    "match": false,
    "differences": [
      {
        "entity": "order",
        "order_id": "O20260710015",
        "cloudbase_amount": 298.00,
        "erp_amount": 278.00,
        "difference": 20.00,
        "suggested_action": "以ERP为准，人工核实原因"
      }
    ],
    "diff_rate": 0.02,
    "status": "review_needed"
  }
}
```

---

## 四、数据同步时序

### 4.1 客户数据同步时序

```
小程序端             CloudBase              ERP Agent            ERP系统
   │                    │                      │                    │
   │  用户注册/更新      │                      │                    │
   │───────────────────>│                      │                    │
   │                    │  写入CloudBase       │                    │
   │                    │──────┐               │                    │
   │                    │<─────┘               │                    │
   │                    │                      │                    │
   │                    │  触发 sync_customer  │                    │
   │                    │  事件                │                    │
   │                    │─────────────────────>│                    │
   │                    │                      │  POST /customer/sync│
   │                    │                      │───────────────────>│
   │                    │                      │                    │
   │                    │                      │   写入ERP数据库     │
   │                    │                      │<──────┐            │
   │                    │                      │       │            │
   │                    │                      │  返回同步结果       │
   │                    │                      │<───────────────────│
   │                    │                      │                    │
   │                    │  返回同步状态         │                    │
   │                    │<─────────────────────│                    │
   │                    │                      │                    │
   │  返回成功           │                      │                    │
   │<───────────────────│                      │                    │

总耗时：< 5秒（正常情况）
重试：失败后30秒/60秒/120秒各重试1次
```

### 4.2 订单数据同步时序

```
小程序端             CloudBase              ERP Agent            ERP系统
   │                    │                      │                    │
   │  用户下单/支付      │                      │                    │
   │───────────────────>│                      │                    │
   │                    │  写入订单+扣减库存   │                    │
   │                    │──────┐               │                    │
   │                    │<─────┘               │                    │
   │                    │                      │                    │
   │                    │  触发 sync_order     │                    │
   │                    │  事件                │                    │
   │                    │─────────────────────>│                    │
   │                    │                      │  POST /order/sync  │
   │                    │                      │───────────────────>│
   │                    │                      │                    │
   │                    │                      │   写入ERP+POS      │
   │                    │                      │<──────┐            │
   │                    │                      │       │            │
   │                    │                      │  返回ERP订单号     │
   │                    │                      │<───────────────────│
   │                    │                      │                    │
   │                    │  更新ERP订单号        │                    │
   │                    │<─────────────────────│                    │
   │                    │                      │                    │
   │  返回支付成功       │                      │                    │
   │<───────────────────│                      │                    │

库存扣减策略：先扣CloudBase库存，ERP同步后以ERP库存为准
支付回调：支付成功后立即触发同步
```

### 4.3 服务完成同步时序

```
门店端               ERP系统              ERP Agent            CloudBase
   │                    │                      │                    │
   │  服务完成签退       │                      │                    │
   │───────────────────>│                      │                    │
   │                    │  写入服务记录         │                    │
   │                    │──────┐               │                    │
   │                    │<─────┘               │                    │
   │                    │                      │                    │
   │                    │  触发 sync_service   │                    │
   │                    │  事件                │                    │
   │                    │─────────────────────>│                    │
   │                    │                      │  POST /service/sync │
   │                    │                      │───────────────────>│
   │                    │                      │                    │
   │                    │                      │   写入服务记录      │
   │                    │                      │   +触发满意度回访   │
   │                    │                      │<──────┐            │
   │                    │                      │       │            │
   │                    │  返回同步结果         │                    │
   │                    │<─────────────────────│                    │
   │                    │                      │                    │
   │  确认同步完成       │                      │                    │
   │<───────────────────│                      │                    │

满意度回访：服务完成后24小时自动触发（followup-agent）
会员积分：服务完成后自动计算并同步
```

### 4.4 会员卡充值同步时序

```
门店端               POS系统              ERP Agent            CloudBase
   │                    │                      │                    │
   │  客户充值           │                      │                    │
   │───────────────────>│                      │                    │
   │                    │  写入POS+ERP         │                    │
   │                    │──────┐               │                    │
   │                    │<─────┘               │                    │
   │                    │                      │                    │
   │                    │  触发 sync_card      │                    │
   │                    │  事件                │                    │
   │                    │─────────────────────>│                    │
   │                    │                      │  POST /member-card │
   │                    │                      │  /sync             │
   │                    │                      │───────────────────>│
   │                    │                      │                    │
   │                    │                      │   更新会员卡余额    │
   │                    │                      │   +更新客户等级     │
   │                    │                      │<──────┐            │
   │                    │                      │       │            │
   │                    │  返回同步结果         │                    │
   │                    │<─────────────────────│                    │
   │                    │                      │                    │
   │  打印小票+同步成功   │                      │                    │
   │<───────────────────│                      │                    │

金额字段：以POS/ERP为准，CloudBase只读同步
客户等级：根据充值金额自动调整（银卡≥2000/金卡≥5000/钻石≥10000）
```

---

## 五、冲突解决策略

### 5.1 冲突类型与策略

| 冲突类型 | 场景 | 解决策略 | 说明 |
|---------|------|---------|------|
| 时间戳冲突 | 两端同时修改同一字段 | latest_wins | 以最后修改时间戳为准 |
| 业务冲突 | 库存不足 | erp_wins | ERP是库存的权威来源 |
| 金额冲突 | 价格不一致 | erp_wins | ERP/POS记录为最终金额 |
| 状态冲突 | 订单状态不一致 | latest_wins | 以最新状态为准 |
| 删除冲突 | 一端删除一端修改 | restore_with_update | 恢复记录并应用修改 |
| 主键冲突 | 重复ID | merge | 合并数据，以完整度高的为准 |

### 5.2 冲突检测与处理流程

```
同步请求到达
    │
    ▼
┌─────────────────┐
│ 检查实体版本号    │
│ (updated_at)     │
└────────┬────────┘
         │
    ┌────▼────┐
    │ 版本一致? │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   是         否
    │         │
    ▼         ▼
┌──────┐  ┌──────────────┐
│直接写入│  │ 检查冲突类型   │
└──┬───┘  └──────┬───────┘
   │              │
   │    ┌─────────┼─────────┐
   │    │         │         │
   │    ▼         ▼         ▼
   │ ┌──────┐ ┌──────┐ ┌──────┐
   │ │latest │ │ erp  │ │merge │
   │ │_wins │ │_wins │ │      │
   │ └──┬───┘ └──┬───┘ └──┬───┘
   │    │        │        │
   └────┼────────┼────────┘
        │        │
        ▼        ▼
  ┌───────────────┐
  │  写入目标数据库 │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │  记录冲突日志   │
  │  +通知相关方    │
  └───────────────┘
```

### 5.3 冲突日志记录

```json
{
  "conflict_id": "CF2026071100001",
  "entity_type": "customer",
  "entity_id": "C2026071100001",
  "conflict_fields": ["phone"],
  "source_a": {
    "system": "cloudbase",
    "value": "138****5678",
    "updated_at": "2026-07-11T10:00:00Z"
  },
  "source_b": {
    "system": "erp",
    "value": "139****1234",
    "updated_at": "2026-07-11T10:05:00Z"
  },
  "resolution": "latest_wins",
  "winner": "erp",
  "resolved_value": "139****1234",
  "resolved_at": "2026-07-11T10:05:01Z",
  "notified_to": ["屈兵"]
}
```

---

## 六、数据安全与隐私合规

### 6.1 数据分级

| 级别 | 数据类别 | 示例 | 保护措施 |
|------|---------|------|---------|
| L1-核心 | 个人身份信息 | 姓名、手机号、身份证号 | AES-256-GCM加密存储，传输层TLS 1.3，脱敏展示 |
| L2-敏感 | 健康相关数据 | 体质类型、腕家H1数据、面诊舌诊结果 | 加密存储，传输加密，仅授权人员可见 |
| L3-业务 | 消费/订单数据 | 消费金额、订单明细、会员卡余额 | 加密存储，传输加密，授权访问 |
| L4-一般 | 行为/偏好数据 | 浏览记录、互动记录、产品偏好 | 标准存储加密，授权访问 |
| L5-公开 | 公开信息 | 昵称、头像、公开评价 | 标准安全措施 |

### 6.2 数据脱敏规则

| 字段 | 脱敏方式 | 展示示例 | 存储方式 |
|------|---------|---------|---------|
| 手机号 | 中间4位隐藏 | 138****5678 | AES-256加密存储 |
| 姓名 | 仅显示姓 | 张** | AES-256加密存储 |
| 身份证号 | 仅显示前3后4位 | 420****1234 | AES-256加密存储 |
| 地址 | 仅显示区级 | 宜昌市伍家岗区 | AES-256加密存储 |
| 微信OpenID | 哈希处理 | hash_xxx | 哈希+加密 |
| 人脸照片 | 特征向量存储 | vector_data | 原始图不存储 |
| 舌诊照片 | 特征向量存储 | vector_data | 原始图加密存储 |
| 腕家H1数据 | 聚合展示 | 平均值/趋势 | 加密存储 |

### 6.3 数据权限矩阵

| 角色 | L1核心 | L2敏感 | L3业务 | L4一般 | L5公开 |
|------|--------|--------|--------|--------|--------|
| 超级管理员（屈兵） | 完整访问 | 完整访问 | 完整访问 | 完整访问 | 完整访问 |
| 店长 | 脱敏访问 | 完整访问 | 完整访问 | 完整访问 | 完整访问 |
| 芳疗师 | 脱敏访问 | 本人客户 | 本人客户 | 本人客户 | 完整访问 |
| AI Agent | 脱敏访问 | 完整访问 | 完整访问 | 完整访问 | 完整访问 |
| 客户本人 | 本人完整 | 本人完整 | 本人完整 | 本人完整 | 完整访问 |
| 其他客户 | 无权限 | 无权限 | 无权限 | 无权限 | 完整访问 |

### 6.4 数据生命周期管理

```
数据创建 → 活跃使用 → 归档 → 删除

1. 数据创建
   - 获取用户明确同意（隐私协议+数据使用授权）
   - 记录创建时间、来源、用途

2. 活跃使用（持续）
   - 加密存储、加密传输
   - 访问权限控制
   - 操作日志记录
   - 定期安全审计

3. 归档（客户流失6个月后）
   - 脱敏处理
   - 冷存储
   - 保留基础画像（用于模型训练）

4. 删除
   - 客户请求删除：7个工作日内完成
   - 法定保留期后自动删除（消费记录保留3年）
   - 注销后永久删除
```

### 6.5 合规要求清单

| 法规/标准 | 适用范围 | 关键要求 | 实现措施 |
|----------|---------|---------|---------|
| 《个人信息保护法》 | 全部用户数据 | 告知-同意、最小必要、删除权 | 隐私协议、数据分级、删除接口 |
| 《数据安全法》 | 全部业务数据 | 数据分类分级、安全保护 | 五级分类、加密存储 |
| 《网络安全法》 | 网络运营者 | 等级保护、安全评估 | 等保二级 |
| 《健康医疗数据安全指南》 | 健康相关数据 | 脱敏处理、使用限制 | 腕家H1数据加密、体质数据脱敏 |
| 《生成式AI服务管理办法》 | AI生成内容 | 标识AI生成、合规声明 | 内容标注、合规声明 |
| 微信小程序运营规范 | 小程序 | 隐私接口审批、数据使用 | 隐私弹窗、授权管理 |
| 各平台内容规范 | 六大平台 | 医疗功效词禁止 | 屏蔽词库、合规话术 |

### 6.6 数据备份与灾备

```
备份策略：
├─ 全量备份：每周日凌晨02:00
├─ 增量备份：每日凌晨02:00
├─ 实时日志：持续写入
└─ 异地备份：每日同步至异地存储

恢复目标：
├─ RPO（数据恢复点）：< 1小时
├─ RTO（服务恢复时间）：< 4小时
└─ 数据完整性验证：每日自动

灾备方案：
├─ 主数据库：CloudBase（腾讯云）
├─ 备份数据库：异地CloudBase实例
├─ 本地备份：门店NAS设备
└─ 切换策略：自动故障转移，5分钟内切换
```

---

## 七、API鉴权与安全

### 7.1 鉴权方式

```
方式1：API Key + HMAC签名（ERP/POS系统对接）
  ├─ 每个对接系统分配独立API Key
  ├─ 请求签名：HMAC-SHA256(API Secret, body + timestamp + nonce)
  ├─ 防重放：timestamp有效期5分钟 + nonce去重
  └─ IP白名单：仅允许门店固定IP访问

方式2：OAuth2（第三方系统对接）
  ├─ Client Credentials模式
  ├─ Token有效期：2小时
  ├─ Refresh Token：7天
  └─ Scope最小权限原则

方式3：内部服务间认证（Agent ↔ CloudBase）
  ├─ CloudBase 云函数内置鉴权
  ├─ 服务账号密钥
  └─ 内网通信
```

### 7.2 安全传输

```
传输层安全：
├─ TLS 1.3 强制
├─ 证书管理：自动续签
├─ HSTS：强制HTTPS
└─ 证书固定（Certificate Pinning）

API安全：
├─ 请求频率限制：每IP每秒10次
├─ 请求大小限制：10MB
├─ 请求超时：30秒
├─ 异常检测：连续失败5次封IP 15分钟
└─ WAF防护：SQL注入/XSS/CSRF
```

---

## 八、监控与告警

### 8.1 同步监控指标

| 指标 | 采集频率 | 告警阈值 | 告警方式 |
|------|---------|---------|---------|
| 同步成功率 | 实时 | <99% | 企微+短信 |
| 同步延迟 | 实时 | >10秒 | 企微 |
| 冲突数量 | 实时 | >5个/小时 | 企微 |
| 对账差异率 | 每日 | >0.1% | 企微 |
| API响应时间 | 实时 | >3秒 | 企微 |
| 错误率 | 实时 | >1% | 企微+短信 |
| 数据积压量 | 实时 | >100条 | 企微 |

### 8.2 监控看板

```
同步监控大屏（实时）
├─ 同步总览
│   ├─ 今日同步总数
│   ├─ 同步成功率
│   ├─ 平均延迟
│   └─ 系统健康状态
├─ 实体同步详情
│   ├─ 客户同步：成功/失败/冲突
│   ├─ 订单同步：成功/失败/冲突
│   ├─ 会员卡同步：成功/失败/冲突
│   ├─ 库存同步：成功/失败/冲突
│   └─ 服务记录同步：成功/失败/冲突
├─ 系统状态
│   ├─ ERP系统：在线/离线
│   ├─ POS系统：在线/离线
│   ├─ CloudBase：在线/离线
│   └─ Agent：运行/停止
└─ 告警列表
    ├─ 当前活跃告警
    ├─ 历史告警趋势
    └─ 告警处理状态
```
