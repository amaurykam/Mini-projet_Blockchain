// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

abstract contract CandidatesManager {
    struct Candidate {
        uint256 id;
        string firstName;
        string lastName;
        string politicalParty;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(bytes32 => bool) internal candidateExists;
    uint256 public candidatesCount;

    event CandidateAdded(
        uint256 indexed candidateId,
        string firstName,
        string lastName,
        string politicalParty
    );

    modifier onlyAdmin() virtual;

    function addCandidate(
        string memory _firstName,
        string memory _lastName,
        string memory _politicalParty
    ) external onlyAdmin {
        bytes32 nameHash = keccak256(
            abi.encodePacked(_firstName, "|", _lastName)
        );
        require(!candidateExists[nameHash], "Candidate already exists");

        candidatesCount++;
        candidates[candidatesCount] = Candidate(
            candidatesCount,
            _firstName,
            _lastName,
            _politicalParty
        );
        candidateExists[nameHash] = true;

        emit CandidateAdded(
            candidatesCount,
            _firstName,
            _lastName,
            _politicalParty
        );
    }

    function candidateExistsById(
        uint256 candidateId
    ) public view returns (bool) {
        return candidateId > 0 && candidateId <= candidatesCount;
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory list = new Candidate[](candidatesCount + 1); // +1 pour Vote Blanc
        for (uint256 i = 0; i <= candidatesCount; i++) {
            list[i] = candidates[i];
        }
        return list;
    }
}