# ============================================================
# 中芳堂AI智能体 V5.2 · AI密钥配置指南
# ============================================================
#
# 🎯 首选：硅基流动（免费2000万Tokens）
#   注册地址：https://cloud.siliconflow.cn
#   步骤：手机号注册 → API密钥 → 新建密钥 → 复制sk-xxx
#   免费额度：2000万Tokens（够用数月）
#   支持模型：DeepSeek-V3, Qwen2.5-7B, Stable Diffusion等
#
# 🎯 备选：DeepSeek（¥1/百万token，极低）
#   注册地址：https://platform.deepseek.com
#   步骤：注册 → API Keys → 创建 → 复制sk-xxx
#
# ⚡ 配置后效果：
#   - 内容生产：从"知识库模板"升级为"AI大模型生成"
#   - 图片生成：从"SVG模板"升级为"AI绘画"
#   - 体质辨证：从"关键词匹配"升级为"AI智能辨证"
#   - 数字人直播：脚本智能化
# ============================================================

# 硅基流动配置（推荐，免费）
SILICONFLOW_API_KEY=sk-your-siliconflow-key-here

# DeepSeek配置（备选，极低费用）
DEEPSEEK_API_KEY=sk-your-deepseek-key-here

# AI端点（硅基流动兼容OpenAI格式）
AI_MODEL_ENDPOINT=https://api.siliconflow.cn/v1
AI_MODEL_TEXT=Qwen/Qwen2.5-7B-Instruct
AI_MODEL_IMAGE=stabilityai/stable-diffusion-xl-base-1.0
