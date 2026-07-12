/**
 * 模型 JSON 安全解析工具
 *
 * 7B 等小参数免费模型在 JSON 模式下仍可能输出：
 *  - 多余的前后说明文字
 *  - 尾随逗号 / 单引号 / 未加引号的中文 key
 *  - 数组元素写成对象（如 oils: [{name:"x"}]）
 * 导致原生 JSON.parse 抛错，进而被调用方静默降级到知识库。
 *
 * 本工具依次尝试：直接解析 → 提取首个 {...} 解析 → 修复常见语法问题后解析。
 * 目的是「尽量从模型输出中抢救出结构化数据」，让 AI 真正生效。
 */

/**
 * 从模型文本中尽量解析出 JSON 对象
 * @param {string} content 模型原始输出
 * @returns {object|null}
 */
export function parseModelJSON(content) {
  if (!content || typeof content !== 'string') return null;

  // 1) 直接解析（最常见成功路径）
  const trimmed = content.trim();
  try {
    const v = JSON.parse(trimmed);
    if (v && typeof v === 'object') return v;
  } catch {
    /* 继续尝试 */
  }

  // 2) 提取首个 {...} 块
  const m = content.match(/\{[\s\S]*\}/);
  if (m) {
    let s = m[0];

    // 2a) 原始块直接解析
    try {
      const v = JSON.parse(s);
      if (v && typeof v === 'object') return v;
    } catch {
      /* 继续修复 */
    }

    // 2b) 常见语法修复
    s = repairJSON(s);
    try {
      const v = JSON.parse(s);
      if (v && typeof v === 'object') return v;
    } catch {
      /* 放弃 */
    }
  }

  return null;
}

/**
 * 修复小模型常见的 JSON 语法瑕疵
 *  - 去除尾随逗号
 *  - 单引号转双引号
 *  - 为未加引号的中英文字段名补双引号
 *  - 去掉字段名/字符串值里偶发的控制字符
 * @param {string} s
 * @returns {string}
 */
function repairJSON(s) {
  return s
    .replace(/[\u0000-\u001F]+/g, ' ') // 控制字符
    .replace(/,\s*([}\]])/g, '$1') // 尾随逗号
    .replace(/'/g, '"') // 单引号
    .replace(/([{,]\s*)([A-Za-z_一-龥][A-Za-z0-9_一-龥]*)\s*:/g, '$1"$2":'); // 未引号 key
}

export default parseModelJSON;
