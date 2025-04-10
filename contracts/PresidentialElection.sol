// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./core/ElectionCore.sol";
import "./utils/ElectionTypes.sol";

/**
 * @title PresidentialElection
 * @dev Contrat principal déployé, qui hérite de ElectionCore (et donc de toute la logique, y compris la gestion des votants via VoterWhitelist).
 */
contract PresidentialElection is ElectionCore {
    using ElectionTypes for ElectionTypes.Election;
    using ElectionTypes for ElectionTypes.Round;

    struct Vote {
        uint256 candidateId;
        uint256 timestamp;
    }

    // Mapping: electionId => round => votant => Vote
    mapping(uint256 => mapping(uint8 => mapping(address => Vote))) public votes;

    event VoteCast(
        uint256 indexed electionId,
        uint8 round,
        uint256 indexed candidateId,
        address voter,
        uint256 timestamp
    );

    /**
     * @notice Crée une élection sans le paramètre _roundDuration (non utilisé)
     * @param _electionStartDate Date de démarrage de l'élection
     * @param _firstRoundStartDate Date de début du premier tour
     * @param _candidateIds Liste des identifiants des candidats
     * @return L'identifiant de l'élection créée
     */
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

    /**
     * @notice Permet à un votant d'enregistrer son vote pour un candidat dans le tour courant de l'élection donnée.
     * @param electionId Identifiant de l'élection
     * @param candidateId Identifiant du candidat choisi
     */
    function castVote(uint256 electionId, uint256 candidateId) external {
        // Vérifie que le votant est enregistré via la whitelist
        require(voters[msg.sender].isRegistered, "Not a registered voter");

        ElectionTypes.Election storage e = elections[electionId];
        require(e.isActive, "Election not active");

        uint8 currentRound = e.currentRound;
        ElectionTypes.Round storage round = electionRounds[electionId][
            currentRound
        ];

        // Vérifie que le vote est effectué pendant le tour actif
        require(block.timestamp >= round.startDate, "Round not started");
        require(block.timestamp <= round.endDate, "Round ended");
        require(
            !roundHasVoted[electionId][currentRound][msg.sender],
            "Already voted"
        );

        // Vérifie que le candidat est bien présent dans le tour courant
        bool validCandidate = false;
        for (uint256 i = 0; i < round.candidateIds.length; i++) {
            if (round.candidateIds[i] == candidateId) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate");

        // Enregistrement du vote
        roundHasVoted[electionId][currentRound][msg.sender] = true;
        roundCandidateVotes[electionId][currentRound][candidateId]++;
        round.totalVotes++;

        votes[electionId][currentRound][msg.sender] = Vote(
            candidateId,
            block.timestamp
        );
        votersByRound[electionId][currentRound].push(msg.sender);

        // Suivi des votants pour l'élection via VoterWhitelist
        trackVoterUsage(electionId, msg.sender);

        emit VoteCast(
            electionId,
            currentRound,
            candidateId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Récupère la liste des candidats pour un tour donné d'une élection
     * @param electionId Identifiant de l'élection
     * @param roundNumber Numéro du tour
     * @return La liste des identifiants des candidats pour ce tour
     */
    function getCandidateIdsForRound(
        uint256 electionId,
        uint8 roundNumber
    ) external view returns (uint256[] memory) {
        return electionRounds[electionId][roundNumber].candidateIds;
    }

    /**
     * @notice Vérifie si un tour est actuellement actif (basé sur block.timestamp)
     * @param electionId Identifiant de l'élection
     * @param roundNumber Numéro du tour
     * @return true si le tour est actif, false sinon
     */
    function isRoundActive(
        uint256 electionId,
        uint8 roundNumber
    ) public view returns (bool) {
        ElectionTypes.Round storage r = electionRounds[electionId][roundNumber];
        return block.timestamp >= r.startDate && block.timestamp <= r.endDate;
    }

    /**
     * @notice Renvoie le timestamp actuel
     * @return Le timestamp actuel (block.timestamp)
     */
    function getCurrentTime() public view returns (uint256) {
        return block.timestamp;
    }

    /**
     * @notice Renvoie le nombre total d'inscrits dans le système (whitelist global)
     * @return Le nombre total d'inscrits
     */
    function getTotalRegisteredVoters() external view returns (uint256) {
        return getRegisteredVotersCount();
    }

    /**
     * @notice Renvoie le nombre de votants ayant participé à un tour précis d'une élection
     * @param electionId Identifiant de l'élection
     * @param roundNumber Numéro du tour
     * @return Le nombre de votants ayant voté dans ce tour
     */
    function getParticipatingVotersCountForRound(
        uint256 electionId,
        uint8 roundNumber
    ) external view returns (uint256) {
        return votersByRound[electionId][roundNumber].length;
    }

    /**
     * @notice Renvoie le résultat final d’une élection présidentielle
     * @dev La fonction est utilisable uniquement si l'élection est terminée :
     *      - L'élection n'est plus active (e.isActive == false)
     *      - Le dernier round (défini par e.currentRound) est finalisé
     * @param _electionId L'identifiant de l'élection
     * @return winnerCandidateId L'identifiant du candidat élu (0 signifie aucun élu, par exemple en cas de vote blanc exclusif)
     */
    function getElectionResult(
        uint256 _electionId
    ) public view returns (uint256 winnerCandidateId) {
        ElectionTypes.Election storage e = elections[_electionId];
        require(!e.isActive, "Election still active, result not available");

        ElectionTypes.Round storage lastRound = electionRounds[_electionId][
            e.currentRound
        ];
        require(lastRound.finalized, "Last round not finalized");

        return e.winnerCandidateId;
    }
}
