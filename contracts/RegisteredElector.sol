// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract RegisteredElector {
    using ECDSA for bytes32;
    
    // Struct representing a registered voter.
    struct Voter {
        address account;
        bool isRegistered;
    }
    
    // Mapping to store voter details by address.
    mapping(address => Voter) public voters;
    
    // Mapping to store a nonce for each address to prevent replay attacks.
    mapping(address => uint256) public nonces;
    
    // Event emitted when a voter is successfully registered.
    event RegisteredEvent(address indexed voter);
    
    // Function to retrieve the current nonce for the caller.
    // The nonce is used in the message that must be signed by the user.
    function getNonce() external returns (uint256) {
        uint256 currentNonce = nonces[msg.sender];
        nonces[msg.sender] = currentNonce + 1;
        return currentNonce;
    }
    
    // Helper function to mimic the Ethereum signed message hash.
    function getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }
    
    // Registration function that verifies the signature of the challenge.
    // The user must provide the nonce they received and the signature obtained via MetaMask.
    function register(uint256 nonce, bytes memory signature) external {
        // Reconstruct the original message: combine the user's address and the nonce.
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, nonce));
        
        // Generate the Ethereum signed message hash.
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        
        // Recover the address that signed the message.
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        
        // Check that the recovered address matches the caller's address.
        require(recoveredSigner == msg.sender, "Invalid signature");
        
        // Register the voter if not already registered.
        require(!voters[msg.sender].isRegistered, "Voter is already registered");
        voters[msg.sender] = Voter({
            account: msg.sender,
            isRegistered: true
        });
        
        // Emit an event indicating successful registration.
        emit RegisteredEvent(msg.sender);
    }
}
