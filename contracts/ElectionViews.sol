// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./PresidentialElection.sol";

contract ElectionViews is PresidentialElection {
    /**
     * @dev Retourne la liste de toutes les élections avec leurs informations :
     * - l'ID de l'élection,
     * - la date de début de l'élection,
     * - la date de fin de l'élection (déterminée à partir de la fin du dernier tour) si terminée, sinon 0.
     */
    function getAllElections()
        external
        view
        returns (
            uint256[] memory electionIds,
            uint256[] memory startDates,
            uint256[] memory endDates
        )
    {
        electionIds = new uint256[](electionsCount);
        startDates = new uint256[](electionsCount);
        endDates = new uint256[](electionsCount);

        for (uint256 i = 1; i <= electionsCount; i++) {
            ElectionTypes.Election storage e = elections[i];
            electionIds[i - 1] = e.electionId;
            startDates[i - 1] = e.electionStartDate;
            if (!e.isActive) {
                endDates[i - 1] = electionRounds[i][e.currentRound].endDate;
            } else {
                endDates[i - 1] = 0;
            }
        }
    }

    /**
     * @dev Retourne le résultat d'un tour avec :
     * - le nombre total de votes (nombre de votants),
     * - la liste des identifiants des candidats,
     * - le nombre de votes correspondants pour chaque candidat,
     * - la date de début et la date de fin du tour.
     * @param _electionId Identifiant de l'élection.
     * @param _round Numéro du tour.
     */
    function getRoundResults(
        uint256 _electionId,
        uint8 _round
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
        ElectionTypes.Round storage round = electionRounds[_electionId][_round];
        totalVotes = round.totalVotes;
        startDate = round.startDate;
        endDate = round.endDate;

        candidateIds = elections[_electionId].candidateIds;
        votesPerCandidate = new uint256[](candidateIds.length);
        for (uint256 i = 0; i < candidateIds.length; i++) {
            votesPerCandidate[i] = roundCandidateVotes[_electionId][_round][candidateIds[i]];
        }
    }


        /**
     * @dev Retrieves the vote count for a candidate in a specific round.
     * @param _electionId Election identifier.
     * @param _round Round number.
     * @param _candidateId Candidate identifier.
     * @return Vote count.
     */
    function getCandidateVotes(
        uint256 _electionId,
        uint8 _round,
        uint256 _candidateId
    ) external view returns (uint256) {
        return roundCandidateVotes[_electionId][_round][_candidateId];
    }

    /**
     * @dev Retrieves the total votes in a specific round.
     * @param _electionId Election identifier.
     * @param _round Round number.
     * @return Total votes.
     */
    function getTotalVotes(
        uint256 _electionId,
        uint8 _round
    ) external view returns (uint256) {
        return electionRounds[_electionId][_round].totalVotes;
    }

    /**
     * @dev View function to obtain the complete list of votes for a round.
     * Returns three parallel arrays:
     * - The addresses of the voters.
     * - The candidate IDs for which they voted.
     * - The corresponding timestamps.
     * @param _electionId Election identifier.
     * @param _round Round number.
     */
    function getVotesForRound(uint256 _electionId, uint8 _round)
        external
        view
        returns (
            address[] memory voterAddresses,
            uint256[] memory candidateIds,
            uint256[] memory timestamps
        )
    {
        voterAddresses = votersByRound[_electionId][_round];
        uint256 count = voterAddresses.length;
        candidateIds = new uint256[](count);
        timestamps = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            address voter = voterAddresses[i];
            Vote storage v = votes[_electionId][_round][voter];
            candidateIds[i] = v.candidateId;
            timestamps[i] = v.timestamp;
        }
    }
}