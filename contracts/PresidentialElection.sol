// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./AdminManager.sol";
import "./ElectionTypes.sol";
import "./VoterWhitelist.sol";

/**
 * @title PresidentialElection
 * @dev Manages a presidential election with rounds.
 * An administrator creates an election by specifying:
 * - The overall election start date.
 * - The start date for the first round (>= election start date).
 * - The duration of each round.
 * - The list of candidate IDs.
 *
 * Additionally, the candidate "Vote blanc" (id = 0) is created by default and
 * will be part of all rounds, regardless of the result.
 *
 * Policy:
 * - First round:
 *    • If a candidate (excluding Vote blanc) obtains >50% of the votes, the election is concluded and that candidate is elected.
 *    • Otherwise, the candidates (excluding Vote blanc) with the highest vote and those tied for second highest
 *      advance to the second round.
 * - Second round:
 *    • The candidate with the highest votes (excluding Vote blanc) wins.
 *    • In case of a tie for first place, the tied candidates (excluding Vote blanc) advance to the third round.
 * - Third round:
 *    • If a candidate (excluding Vote blanc) obtains a clear win, he is elected.
 *    • In case of a tie, the candidate with the highest total votes over rounds 1-3 (excluding Vote blanc) is declared president.
 */
contract PresidentialElection is AdminManager, VoterWhitelist {
    using ElectionTypes for ElectionTypes.Election;
    using ElectionTypes for ElectionTypes.Round;

    uint256 public electionsCount;
    mapping(uint256 => ElectionTypes.Election) public elections;

    // Mapping: electionId => round number => Round details.
    mapping(uint256 => mapping(uint8 => ElectionTypes.Round)) public electionRounds;
    // Mapping: electionId => round number => candidateId => vote count.
    mapping(uint256 => mapping(uint8 => mapping(uint256 => uint256))) public roundCandidateVotes;
    // Mapping: electionId => round number => voter address => bool.
    mapping(uint256 => mapping(uint8 => mapping(address => bool))) public roundHasVoted;

    // Mapping to keep track of the list of addresses that have voted per round.
    mapping(uint256 => mapping(uint8 => address[])) public votersByRound;

    // Structure to store the details of a vote.
    struct Vote {
        uint256 candidateId;
        uint256 timestamp;
    }
    // Mapping to store the complete vote of each voter per round.
    mapping(uint256 => mapping(uint8 => mapping(address => Vote))) public votes;

    event ElectionCreated(
        uint256 indexed electionId,
        uint256 electionStartDate,
        uint256 firstRoundStartDate,
        uint256 roundDuration,
        uint256[] candidateIds
    );
    event VoteCast(
        uint256 indexed electionId,
        uint8 round,
        uint256 indexed candidateId,
        address voter,
        uint256 timestamp
    );
    // finished = true => election finished and winnerCandidateId contains the winner.
    event RoundFinalized(
        uint256 indexed electionId,
        uint8 round,
        bool finished,
        uint256 winnerCandidateId
    );

    /**
     * @dev Creates a new election.
     * Only an administrator can call this function.
     * @param _electionStartDate Overall election start date.
     * @param _firstRoundStartDate Start date for the first round (>= election start date).
     * @param _roundDuration Duration of each round in seconds.
     * @param _candidateIds List of candidate IDs.
     */
    function createElection(
        uint256 _electionStartDate,
        uint256 _firstRoundStartDate,
        uint256 _roundDuration,
        uint256[] calldata _candidateIds
    ) external onlyAdmin {
        require(
            _electionStartDate > block.timestamp,
            "Election start must be in the future"
        );
        require(
            _firstRoundStartDate >= _electionStartDate,
            "First round start must be >= election start"
        );
        require(_roundDuration > 0, "Round duration must be positive");
        require(_candidateIds.length > 0, "At least one candidate required");

        electionsCount++;
        ElectionTypes.Election storage e = elections[electionsCount];
        e.electionId = electionsCount;
        e.electionStartDate = _electionStartDate;
        e.firstRoundStartDate = _firstRoundStartDate;
        e.roundDuration = _roundDuration;
        e.isActive = true;
        e.currentRound = 1;
        e.winnerCandidateId = 0;

        // Create the candidate array including "Vote blanc" (id = 0) by default.
        uint256 totalCandidates = _candidateIds.length + 1;
        e.candidateIds = new uint256[](totalCandidates);
        e.candidateIds[0] = 0; // Vote blanc
        for (uint256 i = 0; i < _candidateIds.length; i++) {
            e.candidateIds[i + 1] = _candidateIds[i];
        }

        // Initialize the first round.
        ElectionTypes.Round storage r = electionRounds[electionsCount][1];
        r.roundNumber = 1;
        r.startDate = _firstRoundStartDate;
        r.endDate = _firstRoundStartDate + _roundDuration;
        r.finalized = false;
        r.totalVotes = 0;
        r.winnerCandidateId = 0;

        emit ElectionCreated(
            electionsCount,
            _electionStartDate,
            _firstRoundStartDate,
            _roundDuration,
            e.candidateIds
        );
    }

    /**
     * @dev Allows a voter to cast a vote during the active round.
     * The vote is timestamped and linked to the voter's wallet address.
     * @param _electionId Election identifier.
     * @param _candidateId Candidate identifier.
     */
    function castVote(uint256 _electionId, uint256 _candidateId) external {
        // Verify that the voter is registered.
        require(voters[msg.sender].isRegistered, "Not registered as voter");

        ElectionTypes.Election storage e = elections[_electionId];
        require(e.isActive, "Election is not active");
        uint8 roundNum = e.currentRound;
        ElectionTypes.Round storage r = electionRounds[_electionId][roundNum];
        require(
            block.timestamp >= r.startDate && block.timestamp <= r.endDate,
            "Not within voting period"
        );
        require(
            !roundHasVoted[_electionId][roundNum][msg.sender],
            "Already voted in this round"
        );

        // Verify that the candidate exists in the election candidate list.
        bool candidateFound = false;
        for (uint256 i = 0; i < e.candidateIds.length; i++) {
            if (e.candidateIds[i] == _candidateId) {
                candidateFound = true;
                break;
            }
        }
        require(candidateFound, "Candidate not in election");

        // Record the vote.
        roundHasVoted[_electionId][roundNum][msg.sender] = true;
        roundCandidateVotes[_electionId][roundNum][_candidateId] += 1;
        r.totalVotes += 1;

        // Store the vote with timestamp.
        votes[_electionId][roundNum][msg.sender] = Vote(_candidateId, block.timestamp);
        // Add the voter's address to the list of voters for this round.
        votersByRound[_electionId][roundNum].push(msg.sender);

        emit VoteCast(_electionId, roundNum, _candidateId, msg.sender, block.timestamp);
    }

    /**
     * @dev Finalizes the current round according to the defined policy.
     * Only an administrator can call this function.
     * The candidate "Vote blanc" (id = 0) is not considered in the deduction of the winner.
     * @param _electionId Election identifier.
     */
    function finalizeRound(uint256 _electionId) external onlyAdmin {
        ElectionTypes.Election storage e = elections[_electionId];
        require(e.isActive, "Election is not active");
        uint8 roundNum = e.currentRound;
        ElectionTypes.Round storage r = electionRounds[_electionId][roundNum];
        require(block.timestamp > r.endDate, "Voting period not ended");
        require(!r.finalized, "Round already finalized");
        require(r.totalVotes > 0, "No votes cast");

        if (roundNum == 1) {
            // --- FIRST ROUND ---
            bool majorityAchieved = false;
            uint256 winningCandidateId = 0;
            for (uint256 i = 0; i < e.candidateIds.length; i++) {
                uint256 candidateId = e.candidateIds[i];
                // Skip Vote blanc.
                if (candidateId == 0) continue;
                uint256 votesCount = roundCandidateVotes[_electionId][roundNum][candidateId];
                if (votesCount * 100 > r.totalVotes * 50) {
                    majorityAchieved = true;
                    winningCandidateId = candidateId;
                    break;
                }
            }
            if (majorityAchieved) {
                e.isActive = false;
                e.winnerCandidateId = winningCandidateId;
                r.finalized = true;
                r.winnerCandidateId = winningCandidateId;
                emit RoundFinalized(_electionId, roundNum, true, winningCandidateId);
                return;
            } else {
                // No candidate achieved >50%: prepare candidates for round two.
                uint256 maxVotes = 0;
                uint256 secondMaxVotes = 0;
                // Compute max and second max ignoring Vote blanc.
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    if (candidateId == 0) continue;
                    uint256 votesCount = roundCandidateVotes[_electionId][roundNum][candidateId];
                    if (votesCount > maxVotes) {
                        secondMaxVotes = maxVotes;
                        maxVotes = votesCount;
                    } else if (votesCount > secondMaxVotes) {
                        secondMaxVotes = votesCount;
                    }
                }
                uint256 countEligible = 0;
                // Count eligible candidates, ignoring Vote blanc.
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    if (candidateId == 0) continue;
                    uint256 votesCount = roundCandidateVotes[_electionId][roundNum][candidateId];
                    if (votesCount == maxVotes || votesCount == secondMaxVotes) {
                        countEligible++;
                    }
                }
                uint256[] memory newCandidates = new uint256[](countEligible);
                uint256 index = 0;
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    if (candidateId == 0) continue;
                    uint256 votesCount = roundCandidateVotes[_electionId][roundNum][candidateId];
                    if (votesCount == maxVotes || votesCount == secondMaxVotes) {
                        newCandidates[index] = candidateId;
                        index++;
                    }
                }
                e.candidateIds = newCandidates;
            }
        } else if (roundNum == 2) {
            // --- SECOND ROUND ---
            uint256 maxVotes = 0;
            uint256 winningCandidateId = 0;
            uint256 countMax = 0;
            for (uint256 i = 0; i < e.candidateIds.length; i++) {
                uint256 candidateId = e.candidateIds[i];
                // Skip Vote blanc.
                if (candidateId == 0) continue;
                uint256 votesCount = roundCandidateVotes[_electionId][roundNum][candidateId];
                if (votesCount > maxVotes) {
                    maxVotes = votesCount;
                    winningCandidateId = candidateId;
                    countMax = 1;
                } else if (votesCount == maxVotes) {
                    countMax++;
                }
            }
            if (countMax == 1) {
                e.isActive = false;
                e.winnerCandidateId = winningCandidateId;
                r.finalized = true;
                r.winnerCandidateId = winningCandidateId;
                emit RoundFinalized(_electionId, roundNum, true, winningCandidateId);
                return;
            }
        } else if (roundNum == 3) {
            // --- THIRD ROUND ---
            uint256 maxVotes = 0;
            uint256 winningCandidateId = 0;
            uint256 countMax = 0;
            for (uint256 i = 0; i < e.candidateIds.length; i++) {
                uint256 candidateId = e.candidateIds[i];
                // Skip Vote blanc.
                if (candidateId == 0) continue;
                uint256 votesCount = roundCandidateVotes[_electionId][roundNum][candidateId];
                if (votesCount > maxVotes) {
                    maxVotes = votesCount;
                    winningCandidateId = candidateId;
                    countMax = 1;
                } else if (votesCount == maxVotes) {
                    countMax++;
                }
            }
            if (countMax == 1) {
                e.isActive = false;
                e.winnerCandidateId = winningCandidateId;
                r.finalized = true;
                r.winnerCandidateId = winningCandidateId;
                emit RoundFinalized(_electionId, roundNum, true, winningCandidateId);
                return;
            } else {
                uint256 maxTotal = 0;
                uint256 finalWinner = 0;
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    // Skip Vote blanc.
                    if (candidateId == 0) continue;
                    uint256 totalVotesCandidate = roundCandidateVotes[_electionId][1][candidateId] +
                        roundCandidateVotes[_electionId][2][candidateId] +
                        roundCandidateVotes[_electionId][3][candidateId];
                    if (totalVotesCandidate > maxTotal) {
                        maxTotal = totalVotesCandidate;
                        finalWinner = candidateId;
                    }
                }
                e.isActive = false;
                e.winnerCandidateId = finalWinner;
                r.finalized = true;
                r.winnerCandidateId = finalWinner;
                emit RoundFinalized(_electionId, roundNum, true, finalWinner);
                return;
            }
        }

        // Finalize current round and prepare for the next.
        r.finalized = true;
        emit RoundFinalized(_electionId, roundNum, false, 0);

        e.currentRound++;
        ElectionTypes.Round storage newRound = electionRounds[_electionId][e.currentRound];
        newRound.roundNumber = e.currentRound;
        newRound.startDate = r.endDate;
        newRound.endDate = newRound.startDate + e.roundDuration;
        newRound.finalized = false;
        newRound.totalVotes = 0;
        newRound.winnerCandidateId = 0;
    }
}