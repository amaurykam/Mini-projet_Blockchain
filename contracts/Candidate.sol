// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Candidate {
    // Address of the contract owner/manager who can add or update candidates.
    address public owner;
    
    // Struct representing a candidate.
    // This structure will be reused in other contracts by referencing Candidate.CandidateStruct.
    struct CandidateStruct {
        uint256 candidateId;
        string name;
        bool isActive;
    }
    
    // Array to store all candidates.
    CandidateStruct[] public candidates;
    
    // Events emitted when candidates are added or updated.
    event CandidateAdded(uint256 candidateId, string name);
    event CandidateUpdated(uint256 candidateId, string newName, bool isActive);
    
    // Modifier to restrict certain functions to the owner only.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function.");
        _;
    }
    
    // Constructor sets the deployer as the initial owner.
    constructor() {
        owner = msg.sender;
    }
    
    // Function to add a new candidate.
    function addCandidate(string memory _name) external onlyOwner {
        uint256 newId = candidates.length;
        
        candidates.push(CandidateStruct({
            candidateId: newId,
            name: _name,
            isActive: true
        }));
        
        emit CandidateAdded(newId, _name);
    }
    
    // Function to update an existing candidate's information.
    function updateCandidate(
        uint256 _candidateId, 
        string memory _newName, 
        bool _isActive
    ) external onlyOwner {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        candidates[_candidateId].name = _newName;
        candidates[_candidateId].isActive = _isActive;
        emit CandidateUpdated(_candidateId, _newName, _isActive);
    }
    
    // Function to retrieve candidate details by ID.
    function getCandidate(uint256 _candidateId) external view returns (
        string memory name, 
        bool isActive
    ) {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        CandidateStruct storage c = candidates[_candidateId];
        return (c.name, c.isActive);
    }
    
    // Function to get the total number of candidates.
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
}
