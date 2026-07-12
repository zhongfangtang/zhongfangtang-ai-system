/**
 * 内容合规服务 - ComplianceService
 *
 * 作用：对所有对外营销文案做「医疗宣称 / 广告法违禁词」清洗，
 * 把易触线的医疗化表述替换为合规的「养生·护理·舒缓」表述，并记录命中项。
 *
 * 合规边界（依据《广告法》《化妆品监督管理条例》及美容养生行业惯例）：
 *   - 美容美体机构不得对疾病作治疗性宣称；
 *   - 不得出现「治疗/治愈/疗效/抗炎/杀菌/排毒」等医疗化用语；
 *   - 不得使用「最/第一/国家级/100%有效」等绝对化用语。
 *
 * 本服务只做文案层面的合规兜底；最终发布前仍建议人工复核。
 *
 * @module services/ComplianceService
 */

import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('ComplianceService');

/**
 * 违禁词 → 合规替换映射（医疗宣称 / 绝对化用语）
 * 仅覆盖高频风险词，强调「养护·舒缓·护理」而非「治疗」。
 */
const REPLACEMENTS = [
  // 医疗化治疗宣称（精确整词，避免单字误伤）
  [/(治疗|治愈|医治|诊疗|治病)/g, '养护'],
  [/(疗效|治愈率)/g, '体验感'],
  [/(抗炎|消炎|杀菌|抗感染)/g, '舒缓'],
  [/(排毒|净化血液|清血)/g, '轻盈焕新'],
  [/(根治|包治)/g, '调理'],
  [/(秘方|药到病除)/g, '配方'],
  [/(祖传|老中医|神医)/g, '传承'],
  [/(立竿见影|速效|一针)/g, '逐步见效'],
  [/(处方|药方)/g, '方案'],
  [/(药用)/g, '植萃'],
  [/(诊断|疾病|症状)/g, '测评'],
  [/(抗癌|防癌|抗肿瘤)/g, '健康守护'],
  [/(丰胸|隆胸)/g, '美胸护理'],
  [/(减肥|溶脂|抽脂)/g, '体态管理'],
  [/(疗程)/g, '护理周期'],
  // 中医养生类温和化（规避医疗化表述）
  [/(祛湿)/g, '轻盈'],
  [/(活血)/g, '焕活'],
  [/(疏肝)/g, '舒心'],
  [/(滋阴)/g, '润养'],
  [/(温阳)/g, '暖养'],
  [/(清热解毒)/g, '清爽'],
  // 绝对化用语（广告法第九条）
  [/(100%有效|百分之百|保证有效|必见效)/g, '值得一试'],
  [/(最(?:好|强|新|佳|有效)|第一品牌|国家级|世界级|极致)/g, '用心'],
];

/** 需标记但不强制替换的敏感词（仅报警，用于人工复核提示） */
const FLAG_WORDS = ['治疗', '治愈', '医疗', '医院', '处方', '抗生素', '激素', '修复受损', '根治', '包治'];

class ComplianceService {
  /**
   * 清洗单段文本：替换违禁词并返回命中记录
   * @param {string} text
   * @returns {{text:string, hits:string[], changed:boolean}}
   */
  sanitize(text) {
    if (!text || typeof text !== 'string') return { text: text || '', hits: [], changed: false };
    let out = text;
    const hits = [];
    for (const [re, rep] of REPLACEMENTS) {
      if (re.test(out)) {
        const matched = out.match(re);
        if (matched) hits.push(matched[0]);
        out = out.replace(re, rep);
      }
    }
    const changed = hits.length > 0;
    if (changed) {
      logger.warn('文案合规清洗', { module: 'ComplianceService', hits: [...new Set(hits)] });
    }
    return { text: out, hits: [...new Set(hits)], changed };
  }

  /**
   * 清洗结构化文案对象（title/body 等字符串字段）
   * @param {object} obj
   * @param {string[]} [fields]
   * @returns {object} 同结构对象（已清洗）
   */
  sanitizeFields(obj, fields = ['title', 'body', 'content', 'subTitle', 'mainTitle', 'cta', 'narration']) {
    if (!obj || typeof obj !== 'object') return obj;
    const allHits = [];
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    const walk = (node) => {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (node && typeof node === 'object') { Object.keys(node).forEach((k) => walk(node[k])); return; }
      if (typeof node === 'string' && fields.includes(node)) { /* noop */ }
    };
    // 针对已知字段做清洗
    for (const f of fields) {
      if (obj[f] && typeof obj[f] === 'string') {
        const r = this.sanitize(obj[f]);
        if (r.changed) { result[f] = r.text; allHits.push(...r.hits); }
      }
    }
    // 也扫描 hashtags 等字符串数组
    if (Array.isArray(obj.hashtags)) {
      result.hashtags = obj.hashtags.map((t) => {
        if (typeof t === 'string') { const r = this.sanitize(t); if (r.changed) allHits.push(...r.hits); return r.text; }
        return t;
      });
    }
    if (allHits.length) result._complianceHits = [...new Set(allHits)];
    return result;
  }

  /** 仅检测是否含敏感词（不替换），用于发布前复核 */
  flag(text) {
    if (!text || typeof text !== 'string') return [];
    return FLAG_WORDS.filter((w) => text.includes(w));
  }
}

const complianceService = new ComplianceService();
export default complianceService;
export { ComplianceService, REPLACEMENTS, FLAG_WORDS };
