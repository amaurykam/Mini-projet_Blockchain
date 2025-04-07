// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./AdminManager.sol";

/**
 * @title ElectionCandidates
 * @dev Contract that manages the candidates for the election.
 *      Only an administrator can add a candidate.
 */
contract ElectionCandidates is AdminManager {
    // Structure to model a candidate.
    struct Candidate {
        uint256 id; // Unique identifier generated automatically.
        string firstName; // Candidate's first name.
        string lastName; // Candidate's last name.
        string politicalParty; // Candidate's political party.
    }

    // Mapping associating a candidate's id with its Candidate object.
    mapping(uint256 => Candidate) public candidates;
    uint256 public candidatesCount;

    // Event emitted when a candidate is added.
    event CandidateAdded(
        uint256 indexed candidateId,
        string firstName,
        string lastName,
        string politicalParty
    );

    /**
     * @dev Adds a candidate and automatically generates a unique identifier.
     *      Only an administrator can call this function.
     * @param _firstName Candidate's first name.
     * @param _lastName Candidate's last name.
     * @param _politicalParty Candidate's political party.
     */
    function addCandidate(
        string memory _firstName,
        string memory _lastName,
        string memory _politicalParty
    ) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(
            candidatesCount,
            _firstName,
            _lastName,
            _politicalParty
        );
        emit CandidateAdded(
            candidatesCount,
            _firstName,
            _lastName,
            _politicalParty
        );
    }
}