// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "../utils/ElectionTypes.sol";

abstract contract ElectionLogic {
    using ElectionTypes for ElectionTypes.Election;
    using ElectionTypes for ElectionTypes.Round;

    uint256 public electionsCount;
    mapping(uint256 => ElectionTypes.Election) public elections;
    mapping(uint256 => mapping(uint8 => ElectionTypes.Round))
        public electionRounds;
    mapping(uint256 => mapping(uint8 => mapping(uint256 => uint256)))
        public roundCandidateVotes;
    mapping(uint256 => mapping(uint8 => address[])) public votersByRound;
    mapping(uint256 => mapping(uint8 => mapping(address => bool)))
        public roundHasVoted;
    mapping(uint256 => uint256[]) public electionWinners; // Gagnants en cas d'égalité au 3e tour
    mapping(uint256 => mapping(uint256 => uint256)) public candidateTotalVotes; // Total des votes par candidat

    event ElectionCreated(
        uint256 indexed electionId,
        uint256 electionStartDate,
        uint256 firstRoundStartDate,
        uint256 roundDuration,
        uint256[] candidateIds
    );

    event RoundFinalized(
        uint256 indexed electionId,
        uint8 round,
        bool finished,
        uint256 winnerCandidateId
    );

    // Structure pour regrouper les statistiques d'un tour
    struct CandidateStats {
        uint256 highestVotes;
        uint256 secondHighestVotes;
        uint256 winningCandidate;
        uint256 countTop;
        uint256[] topCandidates;
    }

    // Calcule et retourne les statistiques des votes pour un tour donné.
    // Le candidat "vote blanc" (ID 0) est ignoré.
    function _computeCandidateStats(
        uint256 electionId,
        uint8 roundNumber
    ) internal returns (CandidateStats memory stats) {
        ElectionTypes.Round storage round = electionRounds[electionId][
            roundNumber
        ];
        uint256 length = round.candidateIds.length;
        stats.topCandidates = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 candidateId = round.candidateIds[i];
            if (candidateId == 0) continue;
            // Accès direct au mapping
            uint256 votesForCandidate = roundCandidateVotes[electionId][
                roundNumber
            ][candidateId];
            if (votesForCandidate > stats.highestVotes) {
                stats.secondHighestVotes = stats.highestVotes;
                stats.highestVotes = votesForCandidate;
                stats.winningCandidate = candidateId;
                stats.topCandidates[0] = candidateId;
                stats.countTop = 1;
            } else if (votesForCandidate == stats.highestVotes) {
                stats.topCandidates[stats.countTop] = candidateId;
                stats.countTop++;
            } else if (votesForCandidate > stats.secondHighestVotes) {
                stats.secondHighestVotes = votesForCandidate;
            }
            candidateTotalVotes[electionId][candidateId] += votesForCandidate;
        }
    }

    // Fonction helper qui compte les candidats dont les votes sont égaux à secondHighest.
    function _countCandidatesWithSecondHighest(
        uint256 electionId,
        uint8 roundNumber,
        uint256 secondHighest,
        uint256[] memory candidateIds
    ) internal view returns (uint256 count) {
        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 candidateId = candidateIds[i];
            if (candidateId == 0) continue;
            if (
                roundCandidateVotes[electionId][roundNumber][candidateId] ==
                secondHighest
            ) {
                count++;
            }
        }
    }

    // Fonction helper qui construit le tableau des candidats pour le tour suivant
    // dans le cas où il faut prendre le gagnant et les candidats avec le second score.
    function _buildNextCandidates(
        uint256 electionId,
        uint8 roundNumber,
        uint256 winningCandidate,
        uint256 secondHighest,
        uint256[] memory candidateIds
    ) internal view returns (uint256[] memory nextCandidates) {
        uint256 countSecond = _countCandidatesWithSecondHighest(
            electionId,
            roundNumber,
            secondHighest,
            candidateIds
        );
        nextCandidates = new uint256[](1 + countSecond);
        nextCandidates[0] = winningCandidate;
        uint256 index = 1;
        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 candidateId = candidateIds[i];
            if (candidateId == 0) continue;
            if (
                roundCandidateVotes[electionId][roundNumber][candidateId] ==
                secondHighest
            ) {
                nextCandidates[index] = candidateId;
                index++;
            }
        }
    }

    function internalCreateElection(
        uint256 _electionStartDate,
        uint256 _firstRoundStartDate,
        uint256[] calldata _candidateIds
    ) internal returns (uint256 electionId) {
        require(
            _electionStartDate > block.timestamp,
            "Election must be in future"
        );
        require(
            _firstRoundStartDate >= _electionStartDate,
            "First round must be after election start"
        );
        require(_candidateIds.length > 0, "At least one candidate");

        electionsCount++;
        electionId = electionsCount;

        ElectionTypes.Election storage e = elections[electionId];
        e.electionId = electionId;
        e.electionStartDate = _electionStartDate;
        e.firstRoundStartDate = _firstRoundStartDate;
        e.roundDuration = 86400; // 24 heures
        e.isActive = true;
        e.currentRound = 1;

        // Ajouter "vote blanc" (id 0) et les candidats sélectionnés
        e.candidateIds = new uint256[](_candidateIds.length + 1);
        e.candidateIds[0] = 0;
        for (uint256 i = 0; i < _candidateIds.length; i++) {
            e.candidateIds[i + 1] = _candidateIds[i];
        }

        // Initialiser le premier tour
        ElectionTypes.Round storage r = electionRounds[electionId][1];
        r.roundNumber = 1;
        r.startDate = _firstRoundStartDate;
        r.endDate = _firstRoundStartDate + 86400;
        r.candidateIds = e.candidateIds;

        emit ElectionCreated(
            electionId,
            _electionStartDate,
            _firstRoundStartDate,
            86400,
            e.candidateIds
        );
    }

    // Enum pour définir les états du tour
    enum RoundStatus {
        NotStarted,
        Active,
        Ended
    }

    function getRoundStatus(
        uint256 _electionId,
        uint8 _round
    ) public view returns (RoundStatus) {
        ElectionTypes.Round storage round = electionRounds[_electionId][_round];

        // Vérification si le tour est terminé (finalized)
        if (round.finalized) {
            return RoundStatus.Ended;
        }

        // Si le tour est forcé à se terminer, il doit être marqué comme finalisé
        if (block.timestamp >= round.endDate && !round.finalized) {
            // On retourne "Ended" même si le tour est en théorie terminé, mais non finalisé
            return RoundStatus.Ended;
        }

        // Vérification si le tour a commencé
        if (block.timestamp >= round.startDate) {
            return RoundStatus.Active;
        }

        // Si le tour n'a pas encore commencé
        return RoundStatus.NotStarted;
    }

    function getRoundResults(
        uint256 _electionId,
        uint8 _round
    )
        public
        view
        returns (
            uint256 totalVotes,
            uint256[] memory candidateIds,
            uint256[] memory votesPerCandidate,
            uint256 startDate,
            uint256 endDate
        )
    {
        ElectionTypes.Round storage round = electionRounds[_electionId][_round];

        require(block.timestamp > round.endDate, "Round not over yet");

        totalVotes = round.totalVotes;
        startDate = round.startDate;
        endDate = round.endDate;

        candidateIds = elections[_electionId].candidateIds;

        votesPerCandidate = new uint256[](candidateIds.length);

        for (uint256 i = 0; i < candidateIds.length; i++) {
            votesPerCandidate[i] = roundCandidateVotes[_electionId][_round][
                candidateIds[i]
            ];
        }
    }

    function finalizeRound(
        uint256 electionId,
        bool force
    ) external /* onlyAdmin */ {
        ElectionTypes.Election storage e = elections[electionId];
        uint8 roundNumber = e.currentRound;
        ElectionTypes.Round storage round = electionRounds[electionId][
            roundNumber
        ];

        if (!force) {
            require(block.timestamp > round.endDate, "Round not ended");
        }
        require(!round.finalized, "Round already finalized");

        uint256 validVotes = round.totalVotes -
            roundCandidateVotes[electionId][roundNumber][0];

        CandidateStats memory stats = _computeCandidateStats(
            electionId,
            roundNumber
        );

        if (roundNumber == 1) {
            if (
                validVotes > 0 &&
                stats.highestVotes * 100 > validVotes * 50 &&
                stats.countTop == 1
            ) {
                e.winnerCandidateId = stats.winningCandidate;
                round.finalized = true;
                emit RoundFinalized(
                    electionId,
                    roundNumber,
                    true,
                    stats.winningCandidate
                );
                e.isActive = false;
            } else {
                uint8 nextRoundNumber = roundNumber + 1;
                e.currentRound = nextRoundNumber;
                ElectionTypes.Round storage nextRound = electionRounds[
                    electionId
                ][nextRoundNumber];
                nextRound.roundNumber = nextRoundNumber;
                nextRound.startDate = block.timestamp;
                nextRound.endDate = block.timestamp + e.roundDuration;

                uint256[] memory nextCandidates;
                if (stats.countTop > 1) {
                    nextCandidates = new uint256[](stats.countTop);
                    for (uint256 i = 0; i < stats.countTop; i++) {
                        nextCandidates[i] = stats.topCandidates[i];
                    }
                } else {
                    nextCandidates = _buildNextCandidates(
                        electionId,
                        roundNumber,
                        stats.winningCandidate,
                        stats.secondHighestVotes,
                        round.candidateIds
                    );
                }
                // Ajout du candidat "vote blanc" en préfixe
                uint256[] memory finalCandidates = new uint256[](
                    nextCandidates.length + 1
                );
                finalCandidates[0] = 0;
                for (uint256 i = 0; i < nextCandidates.length; i++) {
                    finalCandidates[i + 1] = nextCandidates[i];
                }
                nextRound.candidateIds = finalCandidates;
                round.finalized = true;
                emit RoundFinalized(electionId, roundNumber, false, 0);
            }
        } else if (roundNumber == 2) {
            if (stats.countTop == 1) {
                e.winnerCandidateId = stats.winningCandidate;
                round.finalized = true;
                emit RoundFinalized(
                    electionId,
                    roundNumber,
                    true,
                    stats.winningCandidate
                );
                e.isActive = false;
            } else {
                uint8 nextRoundNumber = roundNumber + 1;
                e.currentRound = nextRoundNumber;
                ElectionTypes.Round storage nextRound = electionRounds[
                    electionId
                ][nextRoundNumber];
                nextRound.roundNumber = nextRoundNumber;
                nextRound.startDate = block.timestamp;
                nextRound.endDate = block.timestamp + e.roundDuration;
                uint256[] memory nextCandidates = new uint256[](stats.countTop);
                for (uint256 i = 0; i < stats.countTop; i++) {
                    nextCandidates[i] = stats.topCandidates[i];
                }
                // Ajout du candidat "vote blanc"
                uint256[] memory finalCandidates = new uint256[](
                    nextCandidates.length + 1
                );
                finalCandidates[0] = 0;
                for (uint256 i = 0; i < nextCandidates.length; i++) {
                    finalCandidates[i + 1] = nextCandidates[i];
                }
                nextRound.candidateIds = finalCandidates;
                round.finalized = true;
                emit RoundFinalized(electionId, roundNumber, false, 0);
            }
        } else if (roundNumber == 3) {
            if (stats.countTop == 1) {
                e.winnerCandidateId = stats.winningCandidate;
                round.finalized = true;
                emit RoundFinalized(
                    electionId,
                    roundNumber,
                    true,
                    stats.winningCandidate
                );
                e.isActive = false;
            } else {
                uint256 finalWinner = 0;
                uint256 maxTotalVotes = 0;
                for (uint256 i = 0; i < stats.countTop; i++) {
                    uint256 candidateId = stats.topCandidates[i];
                    uint256 totalVotesForCandidate = candidateTotalVotes[
                        electionId
                    ][candidateId];
                    if (totalVotesForCandidate > maxTotalVotes) {
                        maxTotalVotes = totalVotesForCandidate;
                        finalWinner = candidateId;
                    }
                }
                e.winnerCandidateId = finalWinner;
                electionWinners[electionId] = stats.topCandidates;
                round.finalized = true;
                emit RoundFinalized(electionId, roundNumber, true, finalWinner);
                e.isActive = false;
            }
        }
    }
}
