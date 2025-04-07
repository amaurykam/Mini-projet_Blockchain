// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./AdminManager.sol";

/**
 * @title VoterWhitelist
 * @dev Contract that manages the whitelist of voters.
 *      Lorsqu'une adresse est ajoutée, un objet "Voter" est créé et le timestamp d'inscription est enregistré.
 *      Seuls les administrateurs (ou le contract holder) peuvent ajouter ou retirer des votants.
 */
contract VoterWhitelist is AdminManager {
    // Structure to model a voter with registration timestamp.
    struct Voter {
        bool isRegistered;
        uint256 registrationTime;
    }

    // Mapping associating a voter's address with its Voter object.
    mapping(address => Voter) public voters;

    // Events for adding and removing voters.
    event VoterAdded(address indexed voter, uint256 registrationTime);
    event VoterRemoved(address indexed voter);

    /**
     * @dev Function to add an address to the voter whitelist.
     *      Permet aux administrateurs (ou au contract holder) d'ajouter une adresse dans la whitelist des votants.
     *      Lors de l'ajout, un objet Voter est créé avec le timestamp d'inscription.
     * @param _voter The address to be added as a voter.
     */
    function addVoter(address _voter) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter] = Voter({
            isRegistered: true,
            registrationTime: block.timestamp
        });
        emit VoterAdded(_voter, block.timestamp);
    }

    /**
     * @dev Function to remove an address from the voter whitelist.
     *      Permet aux administrateurs (ou au contract holder) de retirer une adresse de la whitelist des votants.
     * @param _voter The address to be removed.
     */
    function removeVoter(address _voter) external onlyAdmin {
        require(voters[_voter].isRegistered, "Voter not registered");
        delete voters[_voter];
        emit VoterRemoved(_voter);
    }
}
