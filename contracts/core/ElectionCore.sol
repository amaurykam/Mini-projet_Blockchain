// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "../modules/VoterWhitelist.sol";
import "../modules/CandidatesManager.sol";
import "../modules/ElectionLogic.sol";

abstract contract ElectionCore is
    VoterWhitelist,
    CandidatesManager,
    ElectionLogic
{
    address public contractHolder;
    mapping(address => bool) public admins;
    address[] internal adminList;

    modifier onlyHolder() {
        require(msg.sender == contractHolder, "Not contract holder");
        _;
    }

    modifier onlyAdmin() override(VoterWhitelist, CandidatesManager) {
        require(admins[msg.sender], "Not an admin");
        _;
    }

    constructor() {
        contractHolder = msg.sender;
        admins[msg.sender] = true;
        adminList.push(msg.sender);
        emit AdminAdded(msg.sender);

        candidates[0] = Candidate({
            id: 0,
            firstName: "Vote",
            lastName: "Blanc",
            politicalParty: "Aucun"
        });
    }

    event OwnershipTransferred(
        address indexed previousHolder,
        address indexed newHolder
    );
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    function transferOwnership(address _newHolder) external onlyHolder {
        require(_newHolder != address(0), "Invalid address");
        emit OwnershipTransferred(contractHolder, _newHolder);
        contractHolder = _newHolder;
    }

    function addAdmin(address _admin) external onlyHolder {
        require(_admin != address(0), "Invalid address");
        require(!admins[_admin], "Already admin");
        admins[_admin] = true;
        adminList.push(_admin);
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyHolder {
        require(admins[_admin], "Not admin");
        admins[_admin] = false;
        for (uint256 i = 0; i < adminList.length; i++) {
            if (adminList[i] == _admin) {
                adminList[i] = adminList[adminList.length - 1];
                adminList.pop();
                break;
            }
        }
        emit AdminRemoved(_admin);
    }

    function getAdmins() external view returns (address[] memory) {
        return adminList;
    }
}
