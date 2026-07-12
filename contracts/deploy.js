/**
 * Notary 合约部署脚本
 *
 * 前置：
 *   1. 安装依赖：cd server && npm install ethers
 *   2. 在 server/.env 配置：
 *        WEB3_NETWORK=sepolia        （或 mainnet / polygon / bsc）
 *        WEB3_RPC_URL=https://...    （对应网络 RPC，测试网可用默认）
 *        WEB3_PRIVATE_KEY=0x...      （含余额的部署钱包私钥）
 *   3. 测试网领取测试币：https://sepoliafaucet.com
 *
 * 运行：node contracts/deploy.js
 * 成功后把输出的合约地址填入 .env 的 WEB3_CONTRACT_ADDRESS
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', 'server', '.env') });

// 简易内联 ABI（与 Notary.sol 对应，部署时只需要 bytecode + 构造）
const CONTRACT_SOURCE_NOTE =
  '编译命令（需 solc）：npx solc contracts/Notary.sol --bin --abi --optimize -o contracts/build';

const RPC = {
  sepolia: 'https://rpc.sepolia.org',
  mainnet: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  bsc: 'https://bsc-dataseed.bnbchain.org',
};

async function main() {
  const network = process.env.WEB3_NETWORK || 'sepolia';
  const rpcUrl = process.env.WEB3_RPC_URL || RPC[network];
  const privateKey = process.env.WEB3_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ 请在 server/.env 配置 WEB3_PRIVATE_KEY（部署钱包私钥）');
    process.exit(1);
  }

  console.log(`🚀 准备在 ${network} 部署 Notary 合约 (RPC: ${rpcUrl})`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`   部署钱包: ${wallet.address}`);
  console.log(`   余额: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('❌ 钱包余额为 0，请先充值 / 领取测试币后再部署');
    process.exit(1);
  }

  // 读取编译产物。solc 默认输出名为 Notary_sol_Notary.bin/.abi，也可尝试 Notary.bin 回退
  const fs = await import('fs');
  const candidates = [
    resolve(__dirname, 'build', 'Notary_sol_Notary.bin'),
    resolve(__dirname, 'build', 'Notary.bin'),
  ];
  let binPath = candidates.find((p) => fs.existsSync(p));
  if (!binPath) {
    console.error('\n❌ 未找到编译产物 contracts/build/Notary_sol_Notary.bin');
    console.error('   请先编译合约：');
    console.error(`   ${CONTRACT_SOURCE_NOTE}`);
    console.error('   安装 solc：npm install -g solc');
    process.exit(1);
  }
  // 加载 ABI（可选，部署时可传 []，但保存 ABI 便于后续调用）
  const abiCandidates = [binPath.replace('.bin','.abi'), resolve(__dirname,'build','Notary.abi')];
  let abi = [];
  const abiPath = abiCandidates.find((p) => fs.existsSync(p));
  if (abiPath) { try { abi = JSON.parse(fs.readFileSync(abiPath,'utf8')); } catch {} }

  const bytecode = '0x' + fs.readFileSync(binPath, 'utf8').trim();
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log('⏳ 部署中...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\n✅ 部署成功！');
  console.log(`   合约地址: ${address}`);
  console.log(`   区块浏览器: ${explorerUrl(network, address)}`);
  console.log('\n👉 请把以下值填入 server/.env：');
  console.log(`   WEB3_CONTRACT_ADDRESS=${address}`);
  console.log(`   WEB3_CHAIN_ID=${chainId(network)}`);
}

function chainId(network) {
  return { sepolia: 11155111, mainnet: 1, polygon: 137, bsc: 56 }[network] || '';
}
function explorerUrl(network, address) {
  const base = {
    sepolia: 'https://sepolia.etherscan.io/address',
    mainnet: 'https://etherscan.io/address',
    polygon: 'https://polygonscan.com/address',
    bsc: 'https://bscscan.com/address',
  }[network];
  return base ? `${base}/${address}` : '(未知浏览器)';
}

main().catch((err) => {
  console.error('部署失败:', err);
  process.exit(1);
});
