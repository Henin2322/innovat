// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract INNOVToken is ERC20, Ownable {
    address public rewardsContract;
    address public governanceContract;

    uint256 public constant MAX_SUPPLY = 10_000_000 * 10 ** 18;
    uint256 public totalMinted;

    event RewardsContractSet(address indexed addr);
    event GovernanceContractSet(address indexed addr);

    constructor() ERC20("Innovate2Earn", "INNOV") Ownable(msg.sender) {}

    modifier onlyRewards() {
        require(msg.sender == rewardsContract, "INNOVToken: not rewards contract");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governanceContract, "INNOVToken: not governance contract");
        _;
    }

    function setRewardsContract(address _rewards) external onlyOwner {
        rewardsContract = _rewards;
        emit RewardsContractSet(_rewards);
    }

    function setGovernanceContract(address _governance) external onlyOwner {
        governanceContract = _governance;
        emit GovernanceContractSet(_governance);
    }

    function mint(address to, uint256 amount) external onlyRewards {
        require(totalMinted + amount <= MAX_SUPPLY, "INNOVToken: max supply exceeded");
        totalMinted += amount;
        _mint(to, amount);
    }

    function burnForVote(address from, uint256 amount) external onlyGovernance {
        _burn(from, amount);
    }

    function mintTreasury(address to, uint256 amount) external onlyOwner {
        require(totalMinted + amount <= MAX_SUPPLY, "INNOVToken: max supply exceeded");
        totalMinted += amount;
        _mint(to, amount);
    }
}
