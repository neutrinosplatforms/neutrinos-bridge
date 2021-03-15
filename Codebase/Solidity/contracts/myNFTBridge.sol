// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.2;

/// @author Guillaume Gonnaud 2021
/// @title myNFTBridgeERC721Departure
/// @notice Represent the core bridge functions necessary to migrate an ERC-721 NFT from the bridge universe
interface myNFTBridgeERC721Departure /* is ERC165, ERC721TokenReceiver */ {

    // Event emitted when an ERC-721 IOU migration is registered. 
    // Indexed parameter suppose that those events are gonna be parsed for checking provenance of a migrated token
    event MigrationRegisteredERC721IOU(
        address _originOwner,
        address indexed _originWorld, 
        uint256 indexed _originTokenId, 
        bytes32 _destinationUniverse,
        bytes32 _destinationBridge,
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId,
        bytes32 _destinationOwner,
        bytes32 _signee
    );


    // Event emitted when an ERC-721 IOU migration is registered. 
    // Indexed parameter suppose that those events are gonna be parsed for checking provenance of a migrated token
    event MigrationRegisteredERC721Full(
        address _originOwner,
        address indexed _originWorld, 
        uint256 indexed _originTokenId, 
        bytes32 _destinationUniverse,
        bytes32 _destinationBridge,
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId,
        bytes32 _destinationOwner,
        bytes32 _signee
    );


    // Event emitted when a token is deposited in escrow in order to perform a migration
    event ERC721TokenDepositedInEscrow(
        address _originOwner,
        address _operator,
        address indexed _originWorld, 
        uint256 indexed _originTokenId,
        bytes32 indexed _escrowHash // This hash depend of all other migration parameters and the 
        // height of the chain. See documentation for details.
        // _signee will then have to sign this hash before the relay will release at it's destination.
    );


    /// @notice Declare the intent to migrate an ERC-721 token to a different bridge as an IOU token.
    /// Calling this functionIt will assume that the migrating owner is the current owner at function call.
    /// @dev Throw if _originWorld owner disabled IOU migrations for this world.
    /// Emit MigrationRegisteredERC721IOU
    /// Can be called by the owner of the ERC-721 token or one of it's operator
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @param _destinationUniverse An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    /// @param _destinationBridge An array of 32 bytes representing the destination bridge. If the destination
    /// bridge is on an EVM, it is most likely an address.
    /// @param _destinationWorld An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    /// @param _destinationTokenId An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    /// @param _destinationWorld An array of 32 bytes representing the final owner of the migrated token . 
    /// If the destination world is on an EVM, it is most likely an address.
    /// @param _signee The address that will be verified as signing the transfer as legitimate on the destination
    /// If the owner has access to a private key, it should be the owner.
    function migrateToIOUERC721(
        address _originWorld, 
        uint256 _originTokenId, 
        bytes32 _destinationUniverse,
        bytes32 _destinationBridge,
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId,
        bytes32 _destinationOwner,
        bytes32 _signee
    ) external;


    /// @notice Declare the intent to migrate an ERC-721 token to a different bridge as a full migration.
    /// Calling this functionIt will assume that the migrating owner is the current owner at function call.
    /// @dev Throw if _originWorld owner has not set (_destinationUniverse, _destinationWorld) as an accepted
    /// migration.
    /// Will callback onFullMigration(_destinationWorld, _destinationTokenId);
    /// Emit MigrationRegisteredERC721Full
    /// Can be called by the owner of the ERC-721 token or one of it's operator
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @param _destinationUniverse An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    /// @param _destinationBridge An array of 32 bytes representing the destination bridge. If the destination
    /// bridge is on an EVM, it is most likely an address.
    /// @param _destinationWorld An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    /// @param _destinationTokenId An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    /// @param _destinationOwner An array of 32 bytes representing the final owner of the migrated token . 
    /// If the destination world is on an EVM, it is most likely an address.
    /// @param _signee The address that will be verified as signing the transfer as legitimate on the destination
    /// If the owner has access to a private key, it should be the owner.
    function migrateToFullERC721(
        address _originWorld, 
        uint256 _originTokenId, 
        bytes32 _destinationUniverse,
        bytes32 _destinationBridge,
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId,
        bytes32 _destinationOwner,
        bytes32 _signee
    ) external;


    /// @notice Check if an origin NFT token can be migrated to a different token as a full migration
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @param _destinationUniverse An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    /// @param _destinationWorld An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    /// @param _destinationTokenId An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    /// @return TRUE if token can be migrated, FALSE if it can't.
    function acceptedERC721FullMigrationDestination(
        address _originWorld, 
        uint256 _originTokenId, 
        bytes32 _destinationUniverse, 
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId
    ) external view returns(bool);


    /// @notice Check if an origin NFT token can be migrated to a different token as an IOU migration
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @param _destinationUniverse An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    /// @param _destinationWorld An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    /// @param _destinationTokenId An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    /// @return TRUE if token can be migrated, FALSE if it can't.
    function acceptedERC721IOUMigrationDestination(
        address _originWorld, 
        uint256 _originTokenId, 
        bytes32 _destinationUniverse, 
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId
    ) external view returns(bool);


    /// @notice Get the original token ID of a token that used to be ERC-721 migrated trough this bridge
    /// @dev  throw if the token has not been registered for migration or has been migrated back.
    /// @param _destinationUniverse An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    /// @param _destinationWorld An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    /// @param _destinationTokenId An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    /// @return the tokenId of the originToken
    function getERC721OriginTokenId(
        bytes32 _destinationUniverse, 
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId
    ) external view returns(uint256);



    /// @notice Get the original token ID of a token that used to be ERC-721 migrated trough this bridge
    /// @dev throw if this _escrowHash was never emitted. Should keep giving accurate
    /// answers even if the token is migrated back.
    /// @param _escrowHash The escrow hash emitted at token deposit
    /// @return the tokenId of the originToken
    function getERC721OriginTokenId(bytes32 _escrowHash) external view returns(uint256);


    /// @notice Get the original smart contract address of a token that used to be ERC-721 migrated trough this bridge
    /// @dev throw if the token has not been registered for migration or has been migrated back.
    /// @param _destinationUniverse An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    /// @param _destinationWorld An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    /// @param _destinationTokenId An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    /// @return the smart contract address of the migrated origin token
    function getERC721OriginWorld(
        bytes32 _destinationUniverse, 
        bytes32 _destinationWorld,
        bytes32 _destinationTokenId
    ) external view returns(address);


    /// @notice Get the original smart contract address of a token that used to be ERC-721 migrated trough this bridge
    /// @dev throw if this _escrowHash was never emitted. Should keep giving accurate
    /// answers even if the token is migrated back.
    /// @param _escrowHash The escrow hash emitted at token deposit
    /// @return the smart contract address of the migrated origin token
    function getERC721OriginWorld(bytes32 _escrowHash) external view returns(address);

    /// @notice Get the destination universe of a migration registered with this bridge.
    /// @dev throw if the token has not been registered for migration or has been migrated back.
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @return An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    function getERC721DestinationUniverse(
        address _originWorld, 
        uint256 _originTokenId
    ) external view returns (bytes32);

    
    /// @notice Get the destination universe of a migration registered with this bridge.
    /// @dev throw if this _escrowHash was never emitted. Should keep giving accurate
    /// answers even if the token is migrated back.
    /// @param _escrowHash The escrow hash emitted at token deposit.
    /// @return An array of 32 bytes representing the destination universe. 
    /// eg : "Ropsten", "Moonbeam". Please refer to the documentation for a standardized list of destination.
    function getERC721DestinationUniverse(bytes32 _escrowHash) external view returns (bytes32);

    /// @notice Get the destination world of a migration registered with this bridge.
    /// @dev throw if the token has not been registered for migration or has been migrated back.
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @return An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    function getERC721DestinationWorld(
        address _originWorld, 
        uint256 _originTokenId
    ) external view returns (bytes32);

    
    /// @notice Get the destination world of a migration registered with this bridge.
    /// @dev throw if this _escrowHash was never emitted. Should keep giving accurate
    /// answers even if the token is migrated back.
    /// @param _escrowHash The escrow hash emitted at token deposit.
    /// @return An array of 32 bytes representing the destination world of the migrated token. 
    /// If the destination bridge is on an EVM, it is most likely an address.
    function getERC721DestinationWorld(bytes32 _escrowHash) external view returns (bytes32);

    /// @notice Get the destination tokenId of a migration registered with this bridge.
    /// @dev throw if the token has not been registered for migration or has been migrated back.
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @return An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    function getERC721DestinationTokenId(
        address _originWorld, 
        uint256 _originTokenId
    ) external view returns (bytes32);

    
    /// @notice Get the destination tokenId of a migration registered with this bridge.
    /// @dev throw if this _escrowHash was never emitted. Should keep giving accurate
    /// answers even if the token is migrated back.
    /// @param _escrowHash The escrow hash emitted at token deposit.
    /// @return An array of 32 bytes representing the tokenId world of the migrated token. 
    /// If the destination token is an ERC-721 token in an EVM smart contract, it is most likely an uint256.
    function getERC721DestinationTokenId(bytes32 _escrowHash) external view returns (bytes32);

    /// @notice Get the destination bridge of a migration registered with this bridge.
    /// @dev throw if the token has not been registered for migration or has been migrated back.
    /// @param _originWorld The smart contract address of the token currently representing the NFT
    /// @param _originTokenId The token ID of the token representing the NFT
    /// @return An array of 32 bytes representing the destination bridge. If the destination
    /// bridge is on an EVM, it is most likely an address.
    function getERC721DestinationBridge(
        address _originWorld, 
        uint256 _originTokenId
    ) external view returns (bytes32);

    
    /// @notice Get the destination bridge of a migration registered with this bridge.
    /// @dev throw if this _escrowHash was never emitted. Should keep giving accurate
    /// answers even if the token is migrated back.
    /// @param _escrowHash The escrow hash emitted at token deposit.
    /// @return An array of 32 bytes representing the destination bridge. If the destination
    /// bridge is on an EVM, it is most likely an address.
    function getERC721DestinationBridge(bytes32 _escrowHash) external view returns (bytes32);




    /* 
        /// @notice Handle the receipt of an NFT
        /// @dev The ERC721 smart contract calls this function on the
        /// recipient after a `transfer`. This function MAY throw to revert and reject the transfer. Return
        /// of other than the magic value MUST result in the transaction being reverted.
        /// Throw if the received ERC-721 token was NOT pre-registered as either an IOU or FULL migration
        /// emit ERC721TokenDepositedInEscrow
        /// @notice The contract address is always the message sender.
        /// @param _operator The address which called `safeTransferFrom` function
        /// @param _from The address which previously owned the token
        /// @param _tokenId The NFT identifier which is being transferred
        /// @param _data Additional data with no specified format
        /// @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
        /// unless throwing
        function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes calldata _data) external returns(bytes4);
    */

}

/// @author Guillaume Gonnaud 2021
/// @title myNFTBridgeERC721toERC721Arrival
/// @notice Represent the core bridge functions necessary to migrate an ERC-721 toward the bridge universe as an ERC-721 token
interface myNFTBridgeERC721toERC721Arrival {
    
}

/// @author Guillaume Gonnaud 2021
/// @title myNFTBridgeControl
/// @notice Represent the core bridge functions necessary to setup and interact with potentials migrations
interface myNFTBridgeControl {
    
}

/// @author Guillaume Gonnaud 2021
/// @title myNFTBridge
/// @notice Represent the ABI of all the core Bridge functions
interface myNFTBridge is myNFTBridgeERC721Departure, myNFTBridgeERC721toERC721Arrival, myNFTBridgeControl{

}