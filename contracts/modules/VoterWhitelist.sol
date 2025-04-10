    // SPDX-License-Identifier: GPL-3.0
    pragma solidity ^0.8.24;

    abstract contract VoterWhitelist {
        // Liste globale des votants enregistrés
        address[] public voterList;

        struct Voter {
            bool isRegistered;
            uint256 registrationTime;
        }

        // Mapping: adresse => informations d'inscription
        mapping(address => Voter) public voters;

        // Mapping: electionId => liste des adresses ayant participé à cette élection
        mapping(uint256 => address[]) internal electionVoterUsage;

        // Mapping permettant d'éviter les doublons pour un vote dans une élection
        mapping(uint256 => mapping(address => bool)) internal hasVotedInElection;

        event VoterAdded(address indexed voter, uint256 registrationTime);
        event VoterRemoved(address indexed voter);

        modifier onlyAdmin() virtual;

        /**
        * @notice Ajoute un votant à la whitelist globale
        * @param _voter Adresse du votant
        */
        function addVoter(address _voter) external onlyAdmin {
            require(!voters[_voter].isRegistered, "Voter already registered");
            voters[_voter] = Voter(true, block.timestamp);
            voterList.push(_voter);
            emit VoterAdded(_voter, block.timestamp);
        }

        /**
        * @notice Supprime un votant de la whitelist globale
        * @param _voter Adresse du votant
        */
        function removeVoter(address _voter) external onlyAdmin {
            require(voters[_voter].isRegistered, "Voter not registered");
            delete voters[_voter];

            // Suppression de l'adresse dans voterList
            for (uint256 i = 0; i < voterList.length; i++) {
                if (voterList[i] == _voter) {
                    voterList[i] = voterList[voterList.length - 1];
                    voterList.pop();
                    break;
                }
            }

            emit VoterRemoved(_voter);
        }

        /**
        * @notice Suit l'utilisation d'un votant pour une élection donnée (évite les doublons)
        * @param electionId Identifiant de l'élection
        * @param voter Adresse du votant
        */
        function trackVoterUsage(uint256 electionId, address voter) internal {
            if (!hasVotedInElection[electionId][voter]) {
                hasVotedInElection[electionId][voter] = true;
                electionVoterUsage[electionId].push(voter);
            }
        }

        /**
        * @notice Renvoie la liste complète des votants inscrits (pour toutes les élections)
        * @return Tableau des adresses des votants
        */
        function getAllVoters() external view returns (address[] memory) {
            return voterList;
        }

        /**
        * @notice Renvoie le nombre total de votants inscrits dans le système
        * @return Nombre total de votants
        */
        function getRegisteredVotersCount() public view returns (uint256) {
            return voterList.length;
        }

        /**
        * @notice Renvoie le nombre de votants ayant participé à une élection donnée
        * @param electionId Identifiant de l'élection
        * @return Le nombre de votants ayant participé à l'élection
        */
        function getParticipatingVotersCount(
            uint256 electionId
        ) public view returns (uint256) {
            return electionVoterUsage[electionId].length;
        }
    }
