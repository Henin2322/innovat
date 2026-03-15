// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTCertificate is ERC721, Ownable {
    using Strings for uint256;

    address public rewardsContract;
    uint256 public tokenCounter;

    struct Certificate {
        address owner;
        uint256 level;
        string tier;
        uint256 mintedAt;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) public userCertificates;

    event CertificateMinted(address indexed to, uint256 indexed tokenId, string tier, uint256 level);

    constructor() ERC721("Innovate2Earn Certificate", "I2ECERT") Ownable(msg.sender) {}

    modifier onlyRewards() {
        require(msg.sender == rewardsContract, "NFTCertificate: not rewards contract");
        _;
    }

    function setRewardsContract(address _rewards) external onlyOwner {
        rewardsContract = _rewards;
    }

    function mintWelcome(address to) external onlyRewards {
        _mintCertificate(to, 1, "bronze");
    }

    function mintMilestone(address to, uint256 level) external onlyRewards {
        string memory tier;
        if (level == 3) tier = "silver";
        else if (level == 7) tier = "gold";
        else if (level == 12) tier = "platinum";
        else if (level == 15) tier = "diamond";
        else tier = "silver";
        _mintCertificate(to, level, tier);
    }

    function _mintCertificate(address to, uint256 level, string memory tier) internal {
        tokenCounter++;
        _safeMint(to, tokenCounter);
        certificates[tokenCounter] = Certificate({
            owner: to,
            level: level,
            tier: tier,
            mintedAt: block.timestamp
        });
        userCertificates[to].push(tokenCounter);
        emit CertificateMinted(to, tokenCounter, tier, level);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId <= tokenCounter, "Token does not exist");
        Certificate memory cert = certificates[tokenId];

        string memory svg = _buildSVG(cert);
        string memory json = string(abi.encodePacked(
            '{"name":"Innovate2Earn Certificate #', tokenId.toString(), '",',
            '"description":"An evolving on-chain innovation certificate.",',
            '"attributes":[',
                '{"trait_type":"Tier","value":"', cert.tier, '"},',
                '{"trait_type":"Level","value":', cert.level.toString(), '},',
                '{"trait_type":"Minted","value":', cert.mintedAt.toString(), '}',
            '],',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function _buildSVG(Certificate memory) internal pure returns (string memory) {
        return "";
    }

    function getUserCertificates(address user) external view returns (uint256[] memory) {
        return userCertificates[user];
    }
}
