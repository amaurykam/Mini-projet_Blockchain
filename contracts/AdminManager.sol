// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./ContractHolder.sol";

/**
 * @title AdminManager
 * @dev This contract extends ContractHolder to manage one or more administrators who can perform authorized actions,
 *      such as creating elections and adding candidates.
 *      Le contract holder peut ajouter ou retirer des administrateurs, qui disposent d'une autorité sur certaines actions.
 */
contract AdminManager is ContractHolder {
    // Mapping to store administrator addresses.
    mapping(address => bool) public admins;

    // Events for adding and removing administrators.
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    /**
     * @dev Constructor that automatically adds the contract holder as an administrator.
     */
    constructor() {
        admins[contractHolder] = true;
        emit AdminAdded(contractHolder);
    }

    /**
     * @dev Modifier to restrict function calls to administrators.
     *      Seuls les administrateurs peuvent appeler les fonctions protégées.
     */
    modifier onlyAdmin() {
        require(admins[msg.sender], "Not an admin");
        _;
    }

    /**
     * @dev Adds an administrator.
     *      Permet au détenteur du contrat d'ajouter un administrateur.
     * @param _admin The address to be added as an administrator.
     */
    function addAdmin(address _admin) external onlyHolder {
        require(_admin != address(0), "Invalid address");
        require(!admins[_admin], "Already an admin");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    /**
     * @dev Removes an administrator.
     *      Permet au détenteur du contrat de retirer un administrateur.
     * @param _admin The address to be removed.
     */
    function removeAdmin(address _admin) external onlyHolder {
        require(admins[_admin], "Not an admin");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }
}
