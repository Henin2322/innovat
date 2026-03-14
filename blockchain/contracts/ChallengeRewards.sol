// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./INNOVToken.sol";
import "./NFTCertificate.sol";

contract ChallengeRewards is Ownable, ReentrancyGuard {
    INNOVToken public innovToken;
    NFTCertificate public nftCertificate;

    uint256 public constant XP_PER_TOKEN = 100;
    uint256 public constant STREAK_BONUS_PERCENT = 50;
    uint256 public constant STREAK_WINDOW = 36 hours;

    struct Challenge {
        uint256 id;
        string title;
        string category;
        string difficulty;
        uint256 xpReward;
        uint256 multiplier;
        uint256 deadline;
        bool active;
        uint256 submissionCount;
    }

    struct Submission {
        uint256 id;
        uint256 challengeId;
        address submitter;
        string ipfsCid;
        uint256 timestamp;
        uint256 xpAwarded;
        uint256 tokensAwarded;
        uint256 upvotes;
    }

    struct UserProfile {
        uint256 totalXP;
        uint256 level;
        uint256 submissionCount;
        uint256 lastSubmissionTime;
        uint256 currentStreak;
        uint256 longestStreak;
        bool welcomeNFTClaimed;
    }

    uint256 public challengeCounter;
    uint256 public submissionCounter;

    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => Submission) public submissions;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => uint256[]) public userSubmissions;
    mapping(uint256 => uint256[]) public challengeSubmissions;
    mapping(address => mapping(uint256 => bool)) public hasSubmitted;

    uint256[] public levelThresholds = [
        0, 500, 1200, 2500, 4500, 7500, 12000, 18000, 26000, 36000, 50000, 70000, 100000, 140000, 200000
    ];

    mapping(uint256 => bool) public nftMilestoneLevel;

    event ChallengeCreated(uint256 indexed id, string title, uint256 xpReward);
    event IdeaSubmitted(uint256 indexed submissionId, uint256 indexed challengeId, address indexed submitter, string ipfsCid, uint256 xpAwarded, uint256 tokensAwarded);
    event LevelUp(address indexed user, uint256 newLevel);
    event StreakUpdated(address indexed user, uint256 streak);
    event WelcomeNFTClaimed(address indexed user);

    constructor(address _innovToken, address _nftCertificate) Ownable(msg.sender) {
        innovToken = INNOVToken(_innovToken);
        nftCertificate = NFTCertificate(_nftCertificate);
        nftMilestoneLevel[3] = true;
        nftMilestoneLevel[7] = true;
        nftMilestoneLevel[12] = true;
        nftMilestoneLevel[15] = true;
    }

    function createChallenge(string calldata title, string calldata category, string calldata difficulty, uint256 xpReward, uint256 multiplier, uint256 durationInDays) external onlyOwner returns (uint256) {
        challengeCounter++;
        challenges[challengeCounter] = Challenge({
            id: challengeCounter,
            title: title,
            category: category,
            difficulty: difficulty,
            xpReward: xpReward,
            multiplier: multiplier,
            deadline: block.timestamp + (durationInDays * 1 days),
            active: true,
            submissionCount: 0
        });
        emit ChallengeCreated(challengeCounter, title, xpReward);
        return challengeCounter;
    }

    function toggleChallenge(uint256 challengeId) external onlyOwner {
        challenges[challengeId].active = !challenges[challengeId].active;
    }

    function claimWelcomeNFT() external {
        UserProfile storage profile = userProfiles[msg.sender];
        require(!profile.welcomeNFTClaimed, "Already claimed");
        profile.welcomeNFTClaimed = true;
        profile.level = 1;
        nftCertificate.mintWelcome(msg.sender);
        emit WelcomeNFTClaimed(msg.sender);
    }

    function submitIdea(uint256 challengeId, string calldata ipfsCid) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(block.timestamp <= challenge.deadline, "Challenge deadline passed");
        require(!hasSubmitted[msg.sender][challengeId], "Already submitted");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");

        hasSubmitted[msg.sender][challengeId] = true;
        challenge.submissionCount++;
        UserProfile storage profile = userProfiles[msg.sender];

        uint256 baseXP = challenge.xpReward;
        uint256 xpWithMultiplier = (baseXP * challenge.multiplier) / 100;
        uint256 finalXP = xpWithMultiplier;
        _updateStreak(msg.sender);
        if (profile.currentStreak >= 3) {
            finalXP = (xpWithMultiplier * (100 + STREAK_BONUS_PERCENT)) / 100;
        }

        uint256 tokensToMint = (finalXP / XP_PER_TOKEN) * 10 ** 18;
        submissionCounter++;
        submissions[submissionCounter] = Submission({
            id: submissionCounter,
            challengeId: challengeId,
            submitter: msg.sender,
            ipfsCid: ipfsCid,
            timestamp: block.timestamp,
            xpAwarded: finalXP,
            tokensAwarded: tokensToMint,
            upvotes: 0
        });

        userSubmissions[msg.sender].push(submissionCounter);
        challengeSubmissions[challengeId].push(submissionCounter);
        profile.totalXP += finalXP;
        profile.submissionCount++;
        _checkLevelUp(msg.sender);

        if (tokensToMint > 0) {
            innovToken.mint(msg.sender, tokensToMint);
        }

        emit IdeaSubmitted(submissionCounter, challengeId, msg.sender, ipfsCid, finalXP, tokensToMint);
    }

    function _updateStreak(address user) internal {
        UserProfile storage profile = userProfiles[user];
        uint256 timeSinceLast = block.timestamp - profile.lastSubmissionTime;
        if (profile.lastSubmissionTime == 0) {
            profile.currentStreak = 1;
        } else if (timeSinceLast <= STREAK_WINDOW) {
            profile.currentStreak++;
            if (profile.currentStreak > profile.longestStreak) {
                profile.longestStreak = profile.currentStreak;
            }
        } else {
            profile.currentStreak = 1;
        }
        profile.lastSubmissionTime = block.timestamp;
        emit StreakUpdated(user, profile.currentStreak);
    }

    function _checkLevelUp(address user) internal {
        UserProfile storage profile = userProfiles[user];
        uint256 currentLevel = profile.level == 0 ? 1 : profile.level;
        for (uint256 i = currentLevel; i < levelThresholds.length; i++) {
            if (i + 1 < levelThresholds.length && profile.totalXP >= levelThresholds[i]) {
                if (profile.level < i + 1) {
                    profile.level = i + 1;
                    emit LevelUp(user, profile.level);
                    if (nftMilestoneLevel[profile.level]) {
                        nftCertificate.mintMilestone(user, profile.level);
                    }
                }
            }
        }
    }

    function getActiveChallenges() external view returns (Challenge[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= challengeCounter; i++) {
            if (challenges[i].active && block.timestamp <= challenges[i].deadline) count++;
        }
        Challenge[] memory active = new Challenge[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= challengeCounter; i++) {
            if (challenges[i].active && block.timestamp <= challenges[i].deadline) {
                active[idx++] = challenges[i];
            }
        }
        return active;
    }

    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    function getUserSubmissions(address user) external view returns (uint256[] memory) {
        return userSubmissions[user];
    }

    function getXPForNextLevel(address user) external view returns (uint256 current, uint256 needed) {
        UserProfile memory profile = userProfiles[user];
        uint256 lvl = profile.level == 0 ? 1 : profile.level;
        current = profile.totalXP;
        if (lvl < levelThresholds.length) {
            needed = levelThresholds[lvl];
        } else {
            needed = current;
        }
    }
}
