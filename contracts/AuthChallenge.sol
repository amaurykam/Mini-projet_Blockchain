// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract AuthChallenge {
    using ECDSA for bytes32;
    
    // Mapping to store a nonce per address to prevent replay attacks.
    mapping(address => uint256) public nonces;
    
    // Event emitted upon successful registration.
    event Registered(address indexed user);
    
    // Function to retrieve the current nonce for the caller.
    // The nonce is used to compose the message that needs to be signed.
    function getNonce() external returns (uint256) {
        uint256 currentNonce = nonces[msg.sender];
        nonces[msg.sender] = currentNonce + 1;
        return currentNonce;
    }
    
    // Helper function to mimic ECDSA.toEthSignedMessageHash
    function getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }
    
    // Registration function that verifies the signature of the challenge.
    // The user must provide the nonce they received and the signature obtained via MetaMask.
    function register(uint256 nonce, bytes memory signature) external {
        // Reconstruct the original message: here we combine the user's address and the nonce.
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, nonce));
        
        // Generate the Ethereum signed message hash.
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        
        // Recover the address that signed the message.
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        
        // Check that the recovered address matches the caller's address.
        require(recoveredSigner == msg.sender, "Invalid signature");
        
        // At this point, the user is successfully authenticated and can be registered.
        emit Registered(msg.sender);
    }
}