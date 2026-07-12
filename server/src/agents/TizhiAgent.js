/**
 * 体质辨证师·小芳 (TizhiAgent)
 *
 * 中芳堂核心差异化Agent。基于中医九体辨识理论，通过用户输入的症状/诉求，
 * 智能辨证体质类型，推荐对应的精油配方、调理方案、到店服务。
 *
 * 这是中芳堂区别于普通美业店的核心能力，必须重点打磨。
 *
 * @module agents/TizhiAgent
 */

import AgentBase from './base/AgentBase.js';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';
import { parseModelJSON } from '../utils/safeJson.js';

const logger = createModuleLogger('TizhiAgent');

/**
 * 九体辨识知识库（详细版）
 * 每种体质包含：典型表现、辨证要点、推荐精油、调理方案、食疗建议
 */
const TIZHI_KNOWLEDGE = {
  平和质: {
    name: '平和质',
    desc: '体态匀称健壮，面色红润，精力充沛，睡眠好，二便正常',
    symptoms: ['精力充沛', '睡眠好', '面色红润', '适应力强'],
    oils: ['薰衣草', '玫瑰', '甜橙'],
    oilEffect: '维持平衡、舒缓放松',
    plan: '日常居家保养为主，配合节气调理',
    diet: '均衡饮食，多吃时令蔬果',
    suitable: '所有人群，作为健康基准',
  },
  气虚质: {
    name: '气虚质',
    desc: '容易疲乏，气短懒言，易出汗，舌淡红，边有齿痕',
    symptoms: ['疲乏无力', '气短', '易出汗', '语声低弱', '易感冒'],
    oils: ['黄芪精油', '人参精油', '生姜精油'],
    oilEffect: '补气固表、提升元气',
    plan: '居家黄芪精油推拿+到店艾灸补气',
    diet: '多吃山药、红枣、小米、鸡肉',
    suitable: '久坐办公族、产后妈妈、体弱者',
  },
  阳虚质: {
    name: '阳虚质',
    desc: '畏寒怕冷，手足不温，喜热饮食，精神不振',
    symptoms: ['怕冷', '手脚凉', '腰膝酸冷', '精神差', '夜尿多'],
    oils: ['生姜精油', '肉桂精油', '茴香精油'],
    oilEffect: '温阳散寒、暖宫暖肾',
    plan: '居家生姜精油泡脚+到店艾灸温阳',
    diet: '多吃羊肉、桂圆、韭菜、核桃',
    suitable: '怕冷女性、中老年人',
  },
  阴虚质: {
    name: '阴虚质',
    desc: '手足心热，口燥咽干，喜冷饮，大便干燥',
    symptoms: ['手心热', '口干', '皮肤干燥', '失眠', '便秘'],
    oils: ['百合精油', '玉竹精油', '洋甘菊精油'],
    oilEffect: '滋阴润燥、安神助眠',
    plan: '居家百合精油按摩+到店面部补水',
    diet: '多吃银耳、梨、百合、鸭肉',
    suitable: '熬夜族、更年期女性',
  },
  痰湿质: {
    name: '痰湿质',
    desc: '形体肥胖，腹部肥软，面部油多，多汗黏腻',
    symptoms: ['肥胖', '面部油', '痰多', '胸闷', '嗜睡'],
    oils: ['陈皮精油', '柠檬精油', '迷迭香精油'],
    oilEffect: '化痰祛湿、消脂瘦身',
    plan: '居家陈皮精油推拿+到店经络疏通',
    diet: '多吃薏米、茯苓、冬瓜、萝卜',
    suitable: '肥胖人群、代谢慢者',
  },
  湿热质: {
    name: '湿热质',
    desc: '面垢油光，易生痤疮，口苦口臭，大便黏滞',
    symptoms: ['长痘', '口苦', '油腻', '体味重', '小便黄'],
    oils: ['茶树精油', '薄荷精油', '天竺葵精油'],
    oilEffect: '清热利湿、净化排毒',
    plan: '居家茶树精油洁面+到店刮痧清热',
    diet: '多吃绿豆、苦瓜、芹菜、薏米',
    suitable: '痘痘肌、油皮人群',
  },
  血瘀质: {
    name: '血瘀质',
    desc: '面色晦暗，易现瘀斑，唇色偏暗，皮肤干燥',
    symptoms: ['面色暗', '色斑', '唇暗', '月经有块', '健忘'],
    oils: ['当归精油', '红花精油', '玫瑰精油'],
    oilEffect: '活血化瘀、淡斑美白',
    plan: '居家玫瑰精油按摩+到店拨筋活血',
    diet: '多吃山楂、黑木耳、玫瑰花茶',
    suitable: '有色斑者、痛经女性',
  },
  气郁质: {
    name: '气郁质',
    desc: '神情抑郁，情感脆弱，烦闷不乐，胸胁胀满',
    symptoms: ['情绪低落', '胸闷', '叹气', '失眠', '焦虑'],
    oils: ['玫瑰精油', '佛手柑精油', '依兰依兰精油'],
    oilEffect: '疏肝解郁、安神舒缓',
    plan: '居家佛手柑精油香薰+到店芳香疗愈',
    diet: '多吃玫瑰花、陈皮、黄花菜',
    suitable: '高压白领、情绪敏感者',
  },
  特禀质: {
    name: '特禀质',
    desc: '过敏体质，易起荨麻疹，鼻塞喷嚏，对药物食物敏感',
    symptoms: ['过敏', '鼻炎', '荨麻疹', '哮喘', '皮肤痒'],
    oils: ['洋甘菊精油', '薰衣草精油', '没药精油'],
    oilEffect: '抗过敏、修护屏障',
    plan: '居家洋甘菊精油护肤+到店敏感肌修护',
    diet: '避免海鲜发物，多吃胡萝卜、蜂蜜',
    suitable: '敏感肌、过敏体质者',
  },
};

export default class TizhiAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'tizhi-agent',
      name: '体质辨证师·小芳',
      trigger: 'user_message',
      model: opts.model || config.agents.tizhi.model,
      knowledgeBase: '九体辨识精油库',
    });
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 执行辨证（AI可用时调用大模型）
   * @param {Object} input - { symptoms: [], message: '', gender, age }
   */
  async execute(input) {
    const { symptoms = [], message = '', gender, age } = input;
    const prompt = this._buildPrompt({ symptoms, message, gender, age });

    // 调用AI模型
    const aiResult = await this._callAI(prompt);
    if (aiResult) {
      return {
        success: true,
        source: 'ai',
        data: aiResult,
      };
    }
    // AI失败降级到知识库
    return this.fallback(input);
  }

  /**
   * 降级辨证（知识库匹配模式）
   * @param {Object} input
   */
  async fallback(input) {
    const { symptoms = [], message = '' } = input;
    const text = [...symptoms, message].join(' ');

    // 根据关键词匹配体质
    let bestMatch = '平和质';
    let maxScore = 0;
    for (const [tizhi, info] of Object.entries(TIZHI_KNOWLEDGE)) {
      const score = info.symptoms.filter((s) => text.includes(s)).length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = tizhi;
      }
    }

    const info = TIZHI_KNOWLEDGE[bestMatch];
    return {
      success: true,
      source: 'knowledge',
      data: {
        constitution: bestMatch,
        desc: info.desc,
        symptoms: info.symptoms,
        recommendation: {
          oils: info.oils,
          oilEffect: info.oilEffect,
          plan: info.plan,
          diet: info.diet,
          suitable: info.suitable,
        },
        message: `根据您的描述，您偏向${bestMatch}。建议：${info.oilEffect}，推荐${info.oils.join('、')}精油。${info.plan}。`,
      },
    };
  }

  /**
   * 构建辨证提示词
   */
  _buildPrompt({ symptoms, message, gender, age }) {
    return `你是中芳堂资深中医体质辨证师。请根据用户描述判断其体质类型（九体之一）。
用户症状/诉求：${symptoms.join('、') || message}
${gender ? `性别：${gender}` : ''}${age ? ` 年龄：${age}` : ''}

严格要求：只输出一个 JSON 对象，不要任何解释文字、不要 markdown 代码块。
字段说明：
- constitution：九体之一（平和质/气虚质/阳虚质/阴虚质/痰湿质/湿热质/血瘀质/气郁质/特禀质）
- confidence：0~1 的数字
- desc：一句话体质描述
- recommendation.oils：必须是「字符串数组」，例如 ["黄芪精油","人参精油"]，禁止写成对象
- recommendation.oilEffect：精油功效一句话
- recommendation.plan：居家+到店调理方案
- recommendation.diet：食疗建议

示例：{"constitution":"气虚质","confidence":0.9,"desc":"容易疲乏气短","recommendation":{"oils":["黄芪精油","人参精油"],"oilEffect":"补气固表","plan":"居家推拿+到店艾灸","diet":"多吃山药红枣"}}`;
  }

  /**
   * 调用AI模型（OpenAI兼容格式）
   */
  async _callAI(prompt) {
    if (!this.canUseAI) return null;
    try {
      const { default: axios } = await import('axios');
      const r = await axios.post(
        `${config.ai.endpoint}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 600,
          response_format: { type: 'json_object' },
        },
        { timeout: 30000, headers: { Authorization: `Bearer ${config.ai.apiKey}` } }
      );
      const content = r.data?.choices?.[0]?.message?.content || '';
      const parsed = parseModelJSON(content);
      if (parsed && parsed.constitution) {
        // 归一化：oils 可能是对象数组 [{name}] 或字符串数组
        if (Array.isArray(parsed.recommendation?.oils)) {
          parsed.recommendation.oils = parsed.recommendation.oils.map((o) =>
            typeof o === 'string' ? o : (o?.name || o?.oil || String(o))
          );
        }
        return parsed;
      }
    } catch (err) {
      logger.warn('AI辨证调用失败，降级知识库', { error: err.message });
    }
    return null;
  }

  /**
   * 获取体质知识库（供前端展示）
   */
  getKnowledgeBase() {
    return TIZHI_KNOWLEDGE;
  }
}
