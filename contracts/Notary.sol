// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * 中芳堂 · 链上存证合约 Notary
 *
 * 用途：把服务记录 / 产品溯源 / 资质认证的「内容哈希」写入区块链，
 *       实现不可篡改、可公开验证的存证。零存储业务明文，仅存哈希，合规且低成本。
 *
 * 部署成本（参考）：
 *   - Sepolia 测试网：免费（水龙头领测试币）
 *   - 以太坊主网：约 ¥300-800 一次性部署费，单条 notarize Gas 约 ¥20-60
 *   - Polygon / BSC：部署约 ¥10-30，单条存证约 ¥0.1-2
 *
 * 部署：node contracts/deploy.js  （需先配置 .env 的 WEB3_* 与私钥）
 */
contract Notary {
    struct Record {
        uint256 timestamp;
        address notary;
        string recordType;
    }

    /// @notice 哈希 -> 存证记录
    mapping(bytes32 => Record) public records;

    event Notarized(
        bytes32 indexed hash,
        string recordType,
        address indexed notary,
        uint256 timestamp
    );

    /**
     * 存证：把内容哈希写入链上
     * @param hash 内容 keccak256 哈希（0x + 64位十六进制）
     * @param recordType 存证类型：service / product / cert / custom
     */
    function notarize(bytes32 hash, string calldata recordType) external {
        require(records[hash].timestamp == 0, "Notary: already notarized");
        records[hash] = Record(block.timestamp, msg.sender, recordType);
        emit Notarized(hash, recordType, msg.sender, block.timestamp);
    }

    /**
     * 验证：查询某哈希是否已存证
     * @return exists 是否存在
     * @return timestamp 存证时间戳
     * @return notary 存证者地址
     * @return recordType 存证类型
     */
    function verify(bytes32 hash)
        external
        view
        returns (bool exists, uint256 timestamp, address notary, string memory recordType)
    {
        Record storage r = records[hash];
        return (r.timestamp > 0, r.timestamp, r.notary, r.recordType);
    }
}
