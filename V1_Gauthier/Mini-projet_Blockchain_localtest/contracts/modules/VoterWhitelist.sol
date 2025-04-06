// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

abstract contract VoterWhitelist {
    address[] public voterList;
    struct Voter {
        bool isRegistered;
        uint256 registrationTime;
    }

    mapping(address => Voter) public voters;

    event VoterAdded(address indexed voter, uint256 registrationTime);
    event VoterRemoved(address indexed voter);

    modifier onlyAdmin() virtual;

    function addVoter(address _voter) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter] = Voter(true, block.timestamp);
        voterList.push(_voter);
        emit VoterAdded(_voter, block.timestamp);
    }

    function removeVoter(address _voter) external onlyAdmin {
        require(voters[_voter].isRegistered, "Voter not registered");
        delete voters[_voter];

        for (uint256 i = 0; i < voterList.length; i++) {
            if (voterList[i] == _voter) {
                voterList[i] = voterList[voterList.length - 1];
                voterList.pop();
                break;
            }
        }

        emit VoterRemoved(_voter);
    }
    
    function getAllVoters() external view returns (address[] memory) {
        return voterList;
    }
}
