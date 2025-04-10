// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

library ElectionTypes {
    struct Election {
        uint256 electionId; // Identifiant unique.
        uint256 electionStartDate; // Date de début globale.
        uint256 firstRoundStartDate; // Date de début du premier tour.
        uint256 roundDuration; // Durée de chaque tour (secondes).
        uint256[] candidateIds; // Liste des candidats en lice.
        bool isActive; // Vrai si l’élection est en cours.
        uint8 currentRound; // Tour en cours.
        uint256 winnerCandidateId; // ID du candidat élu (0 si non défini).
    }

    struct Round {
        uint8 roundNumber;
        uint256 startDate; // Date de début du tour.
        uint256 endDate; // Date de fin du tour = startDate + roundDuration.
        bool finalized; // Vrai si le tour est finalisé.
        uint256 totalVotes; // Total des voix obtenues.
        uint256 winnerCandidateId; // Si une majorité absolue est atteinte (pour le premier tour) ou pour le tour, sinon 0.
    }
}
