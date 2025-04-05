// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Candidate.sol";

contract Round {
    // The owner (manager) of this round (typically the election authority)
    address public owner;
    // The round number (e.g., 1 for the first round, 2 for the second round, 3 for the third round)
    uint256 public roundNumber;
    
    // Mapping to store cumulative votes from previous rounds for each candidate.
    // This is used only in Round 3 for tie-breaking.
    mapping(uint256 => uint256) public cumulativeVotes;
    
    // Structure representing a candidate in this round.
    // It reuses the CandidateStruct defined in Candidate.sol and adds a vote count for the current round.
    struct RoundCandidate {
        Candidate.CandidateStruct candidate;  // Common candidate data from Candidate.sol
        uint256 votes;                        // Number of votes received in this round
    }
    
    // Array storing all round candidates.
    RoundCandidate[] public candidates;
    
    // Events for tracking candidate actions and round finalization.
    event CandidateAdded(uint256 candidateId, string name);
    event CandidateUpdated(uint256 candidateId, string newName, bool isActive);
    event VoteReceived(uint256 candidateId, uint256 totalVotes);
    // This event emits the candidate IDs that advance or the final winner in round 3.
    event RoundFinalized(uint256[] winners);
    
    // Modifier to restrict functions to the owner only.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function.");
        _;
    }
    
    // Constructor sets the deployer as the owner and initializes the round number.
    constructor(uint256 _roundNumber) {
        owner = msg.sender;
        roundNumber = _roundNumber;
    }
    
    // Function to add a new candidate to this round.
    // It creates a new RoundCandidate using the common candidate structure.
    function addCandidate(string memory _name) external onlyOwner {
        uint256 newId = candidates.length;
        
        // Create a candidate using the structure from Candidate.sol.
        Candidate.CandidateStruct memory baseCandidate = Candidate.CandidateStruct({
            candidateId: newId,
            name: _name,
            isActive: true
        });
        
        // Add the new candidate with an initial vote count of 0.
        candidates.push(RoundCandidate({
            candidate: baseCandidate,
            votes: 0
        }));
        
        emit CandidateAdded(newId, _name);
    }
    
    // Function to update an existing candidate's information in this round.
    // For example, the election authority might mark a candidate as inactive if eliminated.
    function updateCandidate(
        uint256 _candidateId, 
        string memory _newName, 
        bool _isActive
    ) external onlyOwner {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        
        // Update the base candidate's information.
        candidates[_candidateId].candidate.name = _newName;
        candidates[_candidateId].candidate.isActive = _isActive;
        
        emit CandidateUpdated(_candidateId, _newName, _isActive);
    }
    
    // Function to simulate a vote for a candidate in this round.
    function vote(uint256 _candidateId) external {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        require(candidates[_candidateId].candidate.isActive, "Candidate is not active.");
        
        candidates[_candidateId].votes += 1;
        emit VoteReceived(_candidateId, candidates[_candidateId].votes);
    }
    
    // Setter function for the owner to record cumulative votes from previous rounds.
    // This should be called in Round 3 before finalizing the round.
    function setCumulativeVotes(uint256 _candidateId, uint256 _cumulative) external onlyOwner {
        require(_candidateId < candidates.length, "Invalid candidate ID.");
        cumulativeVotes[_candidateId] = _cumulative;
    }
    
    // Function to finalize the round and determine which candidate(s) advance.
    // Logic:
    // - In Round 1: If more than two candidates are tied for the highest votes,
    //   all tied candidates advance; otherwise, the top candidate(s) advance.
    // - In Round 2: If all candidates are tied, all advance to Round 3.
    // - In Round 3: If a tie persists, the contract sums current round votes with cumulative votes from previous rounds,
    //   and the candidate with the highest total wins.
    // The function returns an array of candidate IDs that advance (or the final winner in Round 3).
    function finalizeRound() external onlyOwner returns (uint256[] memory winners) {
        require(candidates.length > 0, "No candidates available.");
        
        // Determine the highest vote count in the current round.
        uint256 highestVotes = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].votes > highestVotes) {
                highestVotes = candidates[i].votes;
            }
        }
        
        // Collect all candidate IDs with the highest vote count.
        uint256 count = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].votes == highestVotes) {
                count++;
            }
        }
        
        winners = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].votes == highestVotes) {
                winners[index] = candidates[i].candidate.candidateId;
                index++;
            }
        }
        
        // Round-specific logic
        if (roundNumber == 1 || roundNumber == 2) {
            // In Round 1 and Round 2, simply return the candidates with the highest votes.
            emit RoundFinalized(winners);
            return winners;
        } else if (roundNumber == 3) {
            // In Round 3, if there is more than one candidate tied in the current round,
            // use cumulative votes (set previously by the owner) to break the tie.
            if (winners.length > 1) {
                uint256 winningCandidate = winners[0];
                uint256 highestTotal = candidates[winningCandidate].votes + cumulativeVotes[winningCandidate];
                
                for (uint256 j = 1; j < winners.length; j++) {
                    uint256 candidateId = winners[j];
                    uint256 totalVotes = candidates[candidateId].votes + cumulativeVotes[candidateId];
                    if (totalVotes > highestTotal) {
                        highestTotal = totalVotes;
                        winningCandidate = candidateId;
                    }
                }
                uint256;
                finalWinner[0] = winningCandidate;
                emit RoundFinalized(finalWinner);
                return finalWinner;
            } else {
                // Only one candidate had the highest votes in Round 3.
                emit RoundFinalized(winners);
                return winners;
            }
        }
        
        // Default: return winners.
        emit RoundFinalized(winners);
        return winners;
    }
    
    // Function to get the total number of candidates in this round.
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
}
