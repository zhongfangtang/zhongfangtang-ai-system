/**
 * Web3 链上存证服务 - Web3Service
 *
 * 基于 ethers v6 的轻量存证引擎，支持：
 *   - 把服务记录 / 产品溯源 / 资质认证「哈希」写入区块链（不可篡改）
 *   - 按哈希查询链上存证是否真实存在
 *   - 测试网（Sepolia，免费）/ 主网（付费）一键切换
 *
 * 成本说明：
 *   - 默认 Sepolia 测试网：部署合约 + 存证 Gas 费≈0（水龙头领测试币）
 *   - 以太坊主网：部署合约一次性约 ¥300-800，单条存证 Gas ≈ ¥20-60
 *   - 不配置私钥 / 合约时，自动降级为「离线哈希」模式（返回哈希但不上链）
 *
 * @module services/Web3Service
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('Web3Service');
const __w3fn = fileURLToPath(import.meta.url);
const __w3dn = path.dirname(__w3fn);

function loadAbi() {
  try {
    const abiPath = path.resolve(__w3dn, '..', '..', '..', 'contracts', 'build', 'Notary_sol_Notary.abi');
    if (fs.existsSync(abiPath)) {
      return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    }
  } catch {}
  return [
    'event Notarized(bytes32 indexed hash, string recordType, address indexed notary, uint256 timestamp)',
    'function notarize(bytes32 hash, string recordType)',
    'function verify(bytes32 hash) view returns (bool exists, uint256 timestamp, address notary, string recordType)',
    'function records(bytes32) view returns (uint256 timestamp, address notary, string recordType)',
  ];
}
const NOTARY_ABI = loadAbi();

/** 各网络默认 RPC（用户也可在 .env 覆盖 WEB3_RPC_URL） */
const DEFAULT_RPC = {
  sepolia: 'https://rpc.sepolia.org',
  mainnet: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  bsc: 'https://bsc-dataseed.bnbchain.org',
};

const CHAIN_IDS = { sepolia: 11155111, mainnet: 1, polygon: 137, bsc: 56 };

class Web3Service {
  /**
   * @param {object} [opts] 可选覆盖配置，便于测试注入
   */
  constructor(opts = {}) {
    this.cfg = opts.web3 || config.web3 || {};
    this.enabled = String(this.cfg.enabled) === 'true';
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this._init();
  }

  /** 初始化 Provider / Wallet / Contract */
  _init() {
    if (!this.enabled) {
      logger.info('Web3 未启用（WEB3_ENABLED=false），存证将走离线哈希模式', { module: 'Web3Service' });
      return;
    }
    try {
      const network = this.cfg.network || 'sepolia';
      const rpcUrl = this.cfg.rpcUrl || DEFAULT_RPC[network] || DEFAULT_RPC.sepolia;
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      if (this.cfg.contractAddress) {
        this.contract = new ethers.Contract(this.cfg.contractAddress, NOTARY_ABI, this.provider);
      }

      if (this.cfg.privateKey) {
        this.wallet = new ethers.Wallet(this.cfg.privateKey, this.provider);
        if (this.contract) this.contract = this.contract.connect(this.wallet);
        logger.info('Web3 写入钱包已绑定', { module: 'Web3Service', address: this.wallet.address });
      }

      logger.info('Web3 初始化完成', {
        module: 'Web3Service',
        network,
        chainId: CHAIN_IDS[network] || this.cfg.chainId,
        contract: this.cfg.contractAddress || '未配置',
        canWrite: !!this.wallet && !!this.contract,
      });
    } catch (err) {
      logger.error('Web3 初始化失败，已降级为离线模式', { module: 'Web3Service', error: err.message });
      this.enabled = false;
      this.provider = null;
      this.contract = null;
      this.wallet = null;
    }
  }

  /** 是否真正连上链 */
  isEnabled() { return this.enabled && !!this.provider; }

  /** 是否具备「写入」能力（需私钥 + 合约） */
  canWrite() { return this.isEnabled() && !!this.wallet && !!this.contract; }

  /** 链信息（供前端/接口展示） */
  getChainInfo() {
    const network = this.cfg.network || 'sepolia';
    return {
      enabled: this.isEnabled(),
      network,
      chainId: CHAIN_IDS[network] || this.cfg.chainId || null,
      rpcUrl: this.cfg.rpcUrl || DEFAULT_RPC[network] || DEFAULT_RPC.sepolia,
      contractAddress: this.cfg.contractAddress || null,
      canWrite: this.canWrite(),
      writerAddress: this.wallet?.address || null,
    };
  }

  /**
   * 计算存证哈希（keccak256）
   * @param {object|string} payload 存证内容
   * @returns {string} 0x 开头的 32 字节哈希
   */
  computeHash(payload) {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  }

  /**
   * 上链存证
   * @param {object} params
   * @param {string} params.type 存证类型：service | product | cert | custom
   * @param {object|string} params.payload 存证内容
   * @param {object} [params.meta] 附属元信息（不上链，仅返回）
   * @returns {Promise<object>}
   */
  async notarize({ type = 'custom', payload, meta = {} } = {}) {
    const hash = this.computeHash(payload);

    // 降级：未配置写入能力 → 返回离线哈希，不真正上链
    if (!this.canWrite()) {
      logger.warn('未配置写入私钥/合约，返回离线哈希（未上链）', { module: 'Web3Service', hash });
      return {
        success: true,
        onChain: false,
        hash,
        type,
        meta,
        reason: 'WEB3_PRIVATE_KEY 或 WEB3_CONTRACT_ADDRESS 未配置，已降级为离线哈希模式',
      };
    }

    try {
      const tx = await this.contract.notarize(hash, type);
      logger.info('存证交易已提交', { module: 'Web3Service', hash, txHash: tx.hash });
      const receipt = await tx.wait();
      return {
        success: true,
        onChain: true,
        hash,
        type,
        meta,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        notarizedBy: this.wallet.address,
      };
    } catch (err) {
      logger.error('存证上链失败', { module: 'Web3Service', error: err.message });
      return { success: false, onChain: false, hash, type, meta, error: err.message };
    }
  }

  /**
   * 验证哈希是否已在链上存证
   * @param {string} hash 0x 开头的哈希
   * @returns {Promise<object>}
   */
  async verify(hash) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return { success: false, verified: false, onChain: this.isEnabled(), error: '哈希格式非法，应为 0x + 64位十六进制' };
    }

    // 未启用链上验证 → 直接返回未启用
    if (!this.isEnabled() || !this.contract) {
      return { success: true, verified: null, onChain: false, reason: 'Web3 未启用或合约未配置，无法链上验证' };
    }

    try {
      const [exists, timestamp, notary, recordType] = await this.contract.verify(hash);
      return {
        success: true,
        verified: !!exists,
        onChain: true,
        hash,
        timestamp: exists ? Number(timestamp) : null,
        notarizedBy: exists ? notary : null,
        recordType: exists ? recordType : null,
      };
    } catch (err) {
      logger.error('链上验证失败', { module: 'Web3Service', error: err.message });
      return { success: false, verified: false, onChain: true, error: err.message };
    }
  }
}

/** 默认单例（读取 config.web3） */
const web3Service = new Web3Service();

export default web3Service;
export { Web3Service, NOTARY_ABI, DEFAULT_RPC, CHAIN_IDS };
