// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

/**
 * @title ContractHolder
 * @dev This contract establishes a unique contract holder who holds ultimate authority and can transfer ownership.
 *      Le détenteur du contrat est unique et peut uniquement déléguer le ownership.
 */
contract ContractHolder {
    // L'adresse du détenteur du contrat.
    address public contractHolder;

    // Événement déclenché lors du transfert de propriété.
    event OwnershipTransferred(
        address indexed previousHolder,
        address indexed newHolder
    );

    constructor() {
        contractHolder = msg.sender;
    }

    /**
     * @dev Modifier to restrict access to the contract holder.
     *      Seul le détenteur du contrat peut appeler les fonctions protégées.
     */
    modifier onlyHolder() {
        require(msg.sender == contractHolder, "Not contract holder");
        _;
    }

    /**
     * @dev Transfers ownership of the contract to a new holder.
     *      Permet au détenteur du contrat de transférer la propriété à une autre adresse.
     * @param _newHolder The address of the new contract holder.
     */
    function transferOwnership(address _newHolder) external onlyHolder {
        require(_newHolder != address(0), "Invalid address");
        emit OwnershipTransferred(contractHolder, _newHolder);
        contractHolder = _newHolder;
    }
}
