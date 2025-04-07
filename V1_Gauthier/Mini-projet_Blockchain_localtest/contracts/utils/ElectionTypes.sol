// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

library ElectionTypes {
    struct Election {
        uint256 electionId;
        uint256 electionStartDate;
        uint256 firstRoundStartDate;
        uint256 roundDuration;
        uint256[] candidateIds;
        bool isActive;
        uint8 currentRound;
        uint256 winnerCandidateId;
    }

    struct Round {
        uint8 roundNumber;
        uint256 startDate;
        uint256 endDate;
        bool finalized;
        uint256 totalVotes;
        uint256 winnerCandidateId;
        uint256[] candidateIds;
    }
}
