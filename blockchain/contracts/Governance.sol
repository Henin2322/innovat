// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./INNOVToken.sol";

contract Governance is Ownable, ReentrancyGuard {
    INNOVToken public innovToken;

    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 forTokens;
        uint256 againstTokens;
        uint256 deadline;
        bool executed;
        bool passed;
        uint256 fundingAmount;
    }

    struct Vote {
        bool hasVoted;
        bool support;
        uint256 tokensLocked;
        uint256 votingPower;
    }

    uint256 public proposalCounter;
    uint256 public constant MIN_TOKENS_TO_PROPOSE = 10 * 10 ** 18;
    uint256 public constant MIN_TOKENS_TO_VOTE = 1 * 10 ** 18;
    uint256 public constant VOTING_PERIOD = 7 days;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;

    event ProposalCreated(uint256 indexed id, string title, address proposer);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 tokens, uint256 power);
    event ProposalExecuted(uint256 indexed id, bool passed);

    constructor(address _innovToken) Ownable(msg.sender) {
        innovToken = INNOVToken(_innovToken);
    }

    function createProposal(string calldata title, string calldata description, uint256 fundingAmount) external returns (uint256) {
        require(innovToken.balanceOf(msg.sender) >= MIN_TOKENS_TO_PROPOSE, "Governance: need 10 $INNOV");
        proposalCounter++;
        proposals[proposalCounter] = Proposal({
            id: proposalCounter,
            title: title,
            description: description,
            proposer: msg.sender,
            forVotes: 0,
            againstVotes: 0,
            forTokens: 0,
            againstTokens: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            executed: false,
            passed: false,
            fundingAmount: fundingAmount
        });
        emit ProposalCreated(proposalCounter, title, msg.sender);
        return proposalCounter;
    }

    function castVote(uint256 proposalId, bool support, uint256 tokenAmount) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.deadline, "Voting period ended");
        require(!votes[proposalId][msg.sender].hasVoted, "Already voted");
        require(tokenAmount >= MIN_TOKENS_TO_VOTE, "Minimum 1 $INNOV");
        require(innovToken.balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");

        uint256 tokensWhole = tokenAmount / 10 ** 18;
        uint256 votingPower = _sqrt(tokensWhole);
        innovToken.burnForVote(msg.sender, tokenAmount);

        votes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            tokensLocked: tokenAmount,
            votingPower: votingPower
        });

        if (support) {
            proposal.forVotes += votingPower;
            proposal.forTokens += tokenAmount;
        } else {
            proposal.againstVotes += votingPower;
            proposal.againstTokens += tokenAmount;
        }
        emit Voted(proposalId, msg.sender, support, tokenAmount, votingPower);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.deadline, "Voting active");
        require(!proposal.executed, "Already executed");
        proposal.executed = true;
        proposal.passed = proposal.forVotes > proposal.againstVotes;
        emit ProposalExecuted(proposalId, proposal.passed);
    }

    function getActiveProposals() external view returns (Proposal[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= proposalCounter; i++) {
            if (!proposals[i].executed && block.timestamp <= proposals[i].deadline) count++;
        }
        Proposal[] memory active = new Proposal[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= proposalCounter; i++) {
            if (!proposals[i].executed && block.timestamp <= proposals[i].deadline) {
                active[idx++] = proposals[i];
            }
        }
        return active;
    }

    function getVotePercentage(uint256 proposalId) external view returns (uint256 forPct, uint256 againstPct) {
        Proposal memory p = proposals[proposalId];
        uint256 total = p.forVotes + p.againstVotes;
        if (total == 0) return (0, 0);
        forPct = (p.forVotes * 100) / total;
        againstPct = (p.againstVotes * 100) / total;
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
