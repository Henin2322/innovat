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

    function _buildSVG(Certificate memory cert) internal pure returns (string memory) {
        string memory bgColor;
        string memory accentColor;
        string memory tierLabel;

        if (keccak256(bytes(cert.tier)) == keccak256(bytes("diamond"))) {
            bgColor = "#0A0A0F"; accentColor = "#C8FF00"; tierLabel = "DIAMOND";
        } else if (keccak256(bytes(cert.tier)) == keccak256(bytes("platinum"))) {
            bgColor = "#0A0A0F"; accentColor = "#FF3CAC"; tierLabel = "PLATINUM";
        } else if (keccak256(bytes(cert.tier)) == keccak256(bytes("gold"))) {
            bgColor = "#1A0F00"; accentColor = "#FFB800"; tierLabel = "GOLD";
        } else if (keccak256(bytes(cert.tier)) == keccak256(bytes("silver"))) {
            bgColor = "#0D0D0D"; accentColor = "#94A3B8"; tierLabel = "SILVER";
        } else {
            bgColor = "#0D0808"; accentColor = "#CD7F32"; tierLabel = "BRONZE";
        }

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="', bgColor, '"/>',
            '<rect x="20" y="20" width="360" height="360" fill="none" stroke="', accentColor, '" stroke-width="2"/>',
            '<text x="200" y="120" text-anchor="middle" font-family="monospace" font-size="14" fill="', accentColor, '">INNOVATE2EARN</text>',
            '<text x="200" y="200" text-anchor="middle" font-family="monospace" font-size="42" font-weight="bold" fill="', accentColor, '">', tierLabel, '</text>',
            '<text x="200" y="260" text-anchor="middle" font-family="monospace" font-size="16" fill="#888">LEVEL ', cert.level.toString(), ' CERTIFICATE</text>',
            '<text x="200" y="340" text-anchor="middle" font-family="monospace" font-size="11" fill="#444">ON-CHAIN INNOVATION PROOF</text>',
            '</svg>'
        ));
    }

    function getUserCertificates(address user) external view returns (uint256[] memory) {
        return userCertificates[user];
    }
}
