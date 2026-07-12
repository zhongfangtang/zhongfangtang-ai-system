/**
 * Agent 编排总控
 *
 * 统一管理所有AI Agent的注册、触发、状态查询和定时调度。
 * 支持：定时触发(cron)、事件触发、手动触发、工作流编排。
 *
 * @module agents/orchestrator
 */

import EventEmitter from 'events';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('AgentOrchestrator');

class AgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();      // agentId -> Agent实例
    this.workflows = new Map();   // workflowName -> 步骤定义
    this.cronJobs = [];           // 定时任务列表
    this.initialized = false;
  }

  /**
   * 初始化并注册所有Agent
   * @param {Array<AgentBase>} agentList - Agent实例数组
   */
  async initialize(agentList = []) {
    for (const agent of agentList) {
      await this.registerAgent(agent);
    }
    this.initialized = true;
    logger.info(`Agent编排器初始化完成，共注册 ${this.agents.size} 个Agent`);
  }

  /**
   * 注册Agent
   * @param {AgentBase} agent - Agent实例
   */
  async registerAgent(agent) {
    if (this.agents.has(agent.id)) {
      logger.warn(`Agent ${agent.id} 已存在，将被覆盖`);
    }
    this.agents.set(agent.id, agent);
    if (agent.initialize) {
      await agent.initialize();
    }
    this.emit('agent-registered', { id: agent.id, name: agent.name });
    logger.info(`Agent已注册: ${agent.name} (${agent.id})`);
    return agent;
  }

  /**
   * 触发单个Agent执行
   * @param {string} agentId - Agent ID
   * @param {Object} input - 任务输入
   * @returns {Promise<Object>} 执行结果
   */
  async triggerAgent(agentId, input = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: `Agent ${agentId} 不存在` };
    }
    if (agent.status === 'paused') {
      return { success: false, error: `Agent ${agentId} 已暂停` };
    }
    this.emit('agent-trigger', { id: agentId, input });
    const result = await agent.run(input);
    this.emit('agent-complete', { id: agentId, result });
    return result;
  }

  /**
   * 批量触发多个Agent
   * @param {Array<string>} agentIds - Agent ID列表
   * @param {Object} input - 共享输入
   */
  async triggerAll(agentIds, input = {}) {
    const results = {};
    for (const id of agentIds) {
      results[id] = await this.triggerAgent(id, input);
    }
    return results;
  }

  /**
   * 执行工作流（按顺序执行多个Agent步骤）
   * @param {string} workflowName - 工作流名称
   * @param {Object} input - 初始输入
   * @returns {Promise<Object>} 工作流结果
   */
  async executeWorkflow(workflowName, input = {}) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      return { success: false, error: `工作流 ${workflowName} 不存在` };
    }

    let context = { ...input };
    const stepResults = [];

    for (const step of workflow.steps) {
      const agent = this.agents.get(step.agentId);
      if (!agent) {
        stepResults.push({ step: step.name, success: false, error: 'Agent不存在' });
        continue;
      }

      const stepInput = { ...context, ...(step.input || {}) };
      const result = await agent.run(stepInput);
      stepResults.push({ step: step.name, success: result.success, data: result });

      // 将步骤结果合并到上下文，供后续步骤使用
      if (result.success && result.data) {
        context = { ...context, ...result.data };
      }
    }

    return { success: true, workflow: workflowName, steps: stepResults, context };
  }

  /**
   * 注册工作流
   * @param {string} name - 工作流名称
   * @param {Object} definition - 工作流定义 { steps: [{ agentId, name, input }] }
   */
  registerWorkflow(name, definition) {
    this.workflows.set(name, definition);
    logger.info(`工作流已注册: ${name} (${definition.steps?.length || 0}步)`);
  }

  /**
   * 注册定时任务
   * @param {Object} job - { agentId, cron, input, name }
   */
  registerCron(job) {
    this.cronJobs.push(job);
    logger.info(`定时任务已注册: ${job.name || job.agentId} (${job.cron})`);
  }

  /**
   * 获取所有Agent状态
   * @returns {Array} Agent状态列表
   */
  getSystemStatus() {
    return Array.from(this.agents.values()).map((a) => a.getStatus());
  }

  /**
   * 获取单个Agent状态
   * @param {string} agentId
   */
  getAgentStatus(agentId) {
    const agent = this.agents.get(agentId);
    return agent ? agent.getStatus() : null;
  }

  /**
   * 获取所有工作流
   */
  getWorkflows() {
    return Array.from(this.workflows.entries()).map(([name, def]) => ({
      name,
      steps: def.steps,
    }));
  }

  /**
   * 暂停Agent
   * @param {string} agentId
   */
  pauseAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.pause();
      return true;
    }
    return false;
  }

  /**
   * 恢复Agent
   * @param {string} agentId
   */
  resumeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.resume();
      return true;
    }
    return false;
  }
}

// 单例模式
const orchestrator = new AgentOrchestrator();

export default orchestrator;
export { AgentOrchestrator };
