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
 * fera partie de tous les tours, quel que soit le résultat.
 *
 * Policy:
 * - First round:
 *    • If a candidate obtains >50% of the votes, the election is concluded and that candidate is elected.
 *    • Otherwise, the candidates with the highest vote and those tied for second highest (leaving top two positions) advance to the second round.
 * - Second round:
 *    • The candidate with the highest votes wins.
 *    • In case of a tie for first place, the tied candidates advance to the third round.
 * - Third round:
 *    • If a candidate obtains a clear win, he is elected.
 *    • In case of a tie, the candidate with the highest total votes over rounds 1-3 is declared president.
 */
contract PresidentialElection is AdminManager, VoterWhitelist {
    using ElectionTypes for ElectionTypes.Election;
    using ElectionTypes for ElectionTypes.Round;

    uint256 public electionsCount;
    mapping(uint256 => ElectionTypes.Election) public elections;

    // Mapping: electionId => round number => Round details.
    mapping(uint256 => mapping(uint8 => ElectionTypes.Round))
        public electionRounds;
    // Mapping: electionId => round number => candidateId => vote count.
    mapping(uint256 => mapping(uint8 => mapping(uint256 => uint256)))
        public roundCandidateVotes;
    // Mapping: electionId => round number => voter address => bool.
    mapping(uint256 => mapping(uint8 => mapping(address => bool)))
        public roundHasVoted;

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
        address voter
    );
    // finished = true => election terminée et winnerCandidateId contient le vainqueur.
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

        // Création du tableau des candidats incluant "Vote blanc" (id = 0) par défaut.
        uint256 totalCandidates = _candidateIds.length + 1;
        e.candidateIds = new uint256[](totalCandidates);
        e.candidateIds[0] = 0; // Vote blanc
        for (uint256 i = 0; i < _candidateIds.length; i++) {
            e.candidateIds[i + 1] = _candidateIds[i];
        }

        // Initialisation du premier tour.
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
     * @param _electionId Election identifier.
     * @param _candidateId Candidate identifier.
     */
    function castVote(uint256 _electionId, uint256 _candidateId) external {
        // Vérifier que l'électeur est inscrit dans la whitelist.
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

        // Vérifier que le candidat est présent dans la liste des candidats de l'élection.
        bool candidateFound = false;
        for (uint256 i = 0; i < e.candidateIds.length; i++) {
            if (e.candidateIds[i] == _candidateId) {
                candidateFound = true;
                break;
            }
        }
        require(candidateFound, "Candidate not in election");

        // Enregistrer le vote.
        roundHasVoted[_electionId][roundNum][msg.sender] = true;
        roundCandidateVotes[_electionId][roundNum][_candidateId] += 1;
        r.totalVotes += 1;

        emit VoteCast(_electionId, roundNum, _candidateId, msg.sender);
    }

    /**
     * @dev Finalizes the current round according to the defined policy.
     * Only an administrator can call this function.
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
            // --- PREMIER TOUR ---
            // Vérification de la majorité absolue (>50%).
            bool majorityAchieved = false;
            uint256 winningCandidateId = 0;
            for (uint256 i = 0; i < e.candidateIds.length; i++) {
                uint256 candidateId = e.candidateIds[i];
                uint256 votes = roundCandidateVotes[_electionId][roundNum][
                    candidateId
                ];
                if (votes * 100 > r.totalVotes * 50) {
                    majorityAchieved = true;
                    winningCandidateId = candidateId;
                    break;
                }
            }
            if (majorityAchieved) {
                // Élection conclue.
                e.isActive = false;
                e.winnerCandidateId = winningCandidateId;
                r.finalized = true;
                r.winnerCandidateId = winningCandidateId;
                emit RoundFinalized(
                    _electionId,
                    roundNum,
                    true,
                    winningCandidateId
                );
                return;
            } else {
                // Aucun candidat n'a obtenu la majorité absolue.
                // Sélection des candidats pour le second tour (basé sur le maximum et le second maximum de votes).
                uint256 maxVotes = 0;
                uint256 secondMaxVotes = 0;
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    uint256 votes = roundCandidateVotes[_electionId][roundNum][
                        candidateId
                    ];
                    if (votes > maxVotes) {
                        secondMaxVotes = maxVotes;
                        maxVotes = votes;
                    } else if (votes > secondMaxVotes) {
                        secondMaxVotes = votes;
                    }
                }

                // Comptage des candidats éligibles selon la règle (max ou second max)
                uint256 countEligible = 0;
                bool voteBlancIncluded = false;
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    uint256 votes = roundCandidateVotes[_electionId][roundNum][
                        candidateId
                    ];
                    if (votes == maxVotes || votes == secondMaxVotes) {
                        countEligible++;
                        if (candidateId == 0) {
                            voteBlancIncluded = true;
                        }
                    }
                }
                // Forcer l'inclusion de "Vote blanc" (id = 0)
                if (!voteBlancIncluded) {
                    countEligible++;
                }

                // Constitution du nouveau tableau de candidats pour le tour suivant.
                uint256[] memory newCandidates = new uint256[](countEligible);
                uint256 index = 0;
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    uint256 votes = roundCandidateVotes[_electionId][roundNum][
                        candidateId
                    ];
                    if (votes == maxVotes || votes == secondMaxVotes) {
                        newCandidates[index] = candidateId;
                        index++;
                    }
                }
                // Si "Vote blanc" n'était pas sélectionné par les votes, l'ajouter manuellement.
                if (!voteBlancIncluded) {
                    newCandidates[index] = 0;
                }
                // Mettre à jour la liste des candidats pour le prochain tour.
                e.candidateIds = newCandidates;
            }
        } else if (roundNum == 2) {
            // --- SECOND TOUR ---
            uint256 maxVotes = 0;
            uint256 winningCandidateId = 0;
            uint256 countMax = 0;
            for (uint256 i = 0; i < e.candidateIds.length; i++) {
                uint256 candidateId = e.candidateIds[i];
                uint256 votes = roundCandidateVotes[_electionId][roundNum][
                    candidateId
                ];
                if (votes > maxVotes) {
                    maxVotes = votes;
                    winningCandidateId = candidateId;
                    countMax = 1;
                } else if (votes == maxVotes) {
                    countMax++;
                }
            }
            if (countMax == 1) {
                // Gagnant clair.
                e.isActive = false;
                e.winnerCandidateId = winningCandidateId;
                r.finalized = true;
                r.winnerCandidateId = winningCandidateId;
                emit RoundFinalized(
                    _electionId,
                    roundNum,
                    true,
                    winningCandidateId
                );
                return;
            }
            // En cas d'égalité, la liste des candidats reste inchangée, ce qui inclut déjà "Vote blanc".
        } else if (roundNum == 3) {
            // --- TROISIÈME TOUR ---
            uint256 maxVotes = 0;
            uint256 winningCandidateId = 0;
            uint256 countMax = 0;
            for (uint256 i = 0; i < e.candidateIds.length; i++) {
                uint256 candidateId = e.candidateIds[i];
                uint256 votes = roundCandidateVotes[_electionId][roundNum][
                    candidateId
                ];
                if (votes > maxVotes) {
                    maxVotes = votes;
                    winningCandidateId = candidateId;
                    countMax = 1;
                } else if (votes == maxVotes) {
                    countMax++;
                }
            }
            if (countMax == 1) {
                e.isActive = false;
                e.winnerCandidateId = winningCandidateId;
                r.finalized = true;
                r.winnerCandidateId = winningCandidateId;
                emit RoundFinalized(
                    _electionId,
                    roundNum,
                    true,
                    winningCandidateId
                );
                return;
            } else {
                // En cas d'égalité dans le troisième tour, comparaison des votes cumulatifs sur les trois tours.
                uint256 maxTotal = 0;
                uint256 finalWinner = 0;
                for (uint256 i = 0; i < e.candidateIds.length; i++) {
                    uint256 candidateId = e.candidateIds[i];
                    uint256 total = roundCandidateVotes[_electionId][1][
                        candidateId
                    ] +
                        roundCandidateVotes[_electionId][2][candidateId] +
                        roundCandidateVotes[_electionId][3][candidateId];
                    if (total > maxTotal) {
                        maxTotal = total;
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

        // Finalisation du tour courant et préparation du suivant.
        r.finalized = true;
        emit RoundFinalized(_electionId, roundNum, false, 0);

        e.currentRound++;
        ElectionTypes.Round storage newRound = electionRounds[_electionId][
            e.currentRound
        ];
        newRound.roundNumber = e.currentRound;
        newRound.startDate = r.endDate; // Le nouveau tour démarre immédiatement après la fin du précédent.
        newRound.endDate = newRound.startDate + e.roundDuration;
        newRound.finalized = false;
        newRound.totalVotes = 0;
        newRound.winnerCandidateId = 0;
    }
}
