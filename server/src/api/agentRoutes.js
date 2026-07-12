/**
 * AI智能体管理 API
 *
 * 提供Agent状态查询、手动触发、日志、指标、工作流管理接口。
 *
 * @module api/agentRoutes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import orchestrator from '../agents/orchestrator.js';
import { AgentRunLog } from '../services/DatabaseService.js';

const router = Router();

// 所有接口需要认证
router.use(authenticate);

/**
 * GET /api/v1/agents - 获取所有Agent状态
 */
router.get('/', (req, res) => {
  try {
    const status = orchestrator.getSystemStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/agents/:id - 获取单个Agent状态
 */
router.get('/:id', (req, res) => {
  const status = orchestrator.getAgentStatus(req.params.id);
  if (!status) {
    return res.status(404).json({ success: false, message: 'Agent不存在' });
  }
  res.json({ success: true, data: status });
});

/**
 * POST /api/v1/agents/:id/trigger - 手动触发Agent
 */
router.post('/:id/trigger', async (req, res) => {
  try {
    const result = await orchestrator.triggerAgent(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/agents/:id/logs - 获取Agent运行日志
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await AgentRunLog.find({ agentId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/agents/:id/pause - 暂停Agent
 */
router.post('/:id/pause', (req, res) => {
  const ok = orchestrator.pauseAgent(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Agent不存在' });
  res.json({ success: true, message: '已暂停' });
});

/**
 * POST /api/v1/agents/:id/resume - 恢复Agent
 */
router.post('/:id/resume', (req, res) => {
  const ok = orchestrator.resumeAgent(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Agent不存在' });
  res.json({ success: true, message: '已恢复' });
});

/**
 * GET /api/v1/agents/workflows - 获取工作流列表
 */
router.get('/workflows', (req, res) => {
  const workflows = orchestrator.getWorkflows();
  res.json({ success: true, data: workflows });
});

/**
 * POST /api/v1/agents/workflows/trigger - 触发工作流
 */
router.post('/workflows/trigger', async (req, res) => {
  try {
    const { name, input } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '缺少工作流名称' });
    const result = await orchestrator.executeWorkflow(name, input || {});
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
