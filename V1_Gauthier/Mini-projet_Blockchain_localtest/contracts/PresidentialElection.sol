// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./core/ElectionCore.sol";
import "./utils/ElectionTypes.sol";

/**
 * @title PresidentialElection
 * @dev Contrat principal déployé, qui hérite de ElectionCore (et donc de toute la logique).
 */
contract PresidentialElection is ElectionCore {
    using ElectionTypes for ElectionTypes.Election;
    using ElectionTypes for ElectionTypes.Round;

    struct Vote {
        uint256 candidateId;
        uint256 timestamp;
    }

    mapping(uint256 => mapping(uint8 => mapping(address => Vote))) public votes;

    event VoteCast(
        uint256 indexed electionId,
        uint8 round,
        uint256 indexed candidateId,
        address voter,
        uint256 timestamp
    );

    // Retirez le paramètre _roundDuration car il n'est plus utilisé
    function createElection(
        uint256 _electionStartDate,
        uint256 _firstRoundStartDate,
        uint256[] calldata _candidateIds
    ) external onlyAdmin returns (uint256) {
        return
            internalCreateElection(
                _electionStartDate,
                _firstRoundStartDate,
                _candidateIds
            );
    }

    function castVote(uint256 electionId, uint256 candidateId) external {
        require(voters[msg.sender].isRegistered, "Not a registered voter");

        ElectionTypes.Election storage e = elections[electionId];
        require(e.isActive, "Election not active");

        uint8 currentRound = e.currentRound;
        ElectionTypes.Round storage round = electionRounds[electionId][
            currentRound
        ];

        require(block.timestamp >= round.startDate, "Round not started");
        require(block.timestamp <= round.endDate, "Round ended");
        require(
            !roundHasVoted[electionId][currentRound][msg.sender],
            "Already voted"
        );

        bool validCandidate = false;
        for (uint256 i = 0; i < round.candidateIds.length; i++) {
            if (round.candidateIds[i] == candidateId) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate");

        roundHasVoted[electionId][currentRound][msg.sender] = true;
        roundCandidateVotes[electionId][currentRound][candidateId]++;
        round.totalVotes++;

        votes[electionId][currentRound][msg.sender] = Vote(
            candidateId,
            block.timestamp
        );
        votersByRound[electionId][currentRound].push(msg.sender);

        emit VoteCast(
            electionId,
            currentRound,
            candidateId,
            msg.sender,
            block.timestamp
        );
    }

    function getElectionRoundResults(
        uint256 electionId,
        uint8 round
    )
        external
        view
        returns (
            uint256 totalVotes,
            uint256[] memory candidateIds,
            uint256[] memory votesPerCandidate,
            uint256 startDate,
            uint256 endDate
        )
    {
        return getRoundResults(electionId, round);
    }

    function getCandidateIdsForRound(
        uint256 electionId,
        uint8 roundNumber
    ) external view returns (uint256[] memory) {
        return electionRounds[electionId][roundNumber].candidateIds;
    }

    function isRoundActive(
        uint256 electionId,
        uint8 roundNumber
    ) public view returns (bool) {
        ElectionTypes.Round storage r = electionRounds[electionId][roundNumber];
        return block.timestamp >= r.startDate && block.timestamp <= r.endDate;
    }
}
