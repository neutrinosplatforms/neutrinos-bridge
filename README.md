# Neutrinos Platform-Bridge
The work in progress of an universal NFT bridge. 

## Abstract
A codebase for deploying and running opinionless EVM NFT bridges allowing the transfer of NFTs between them trough third party relays who are themselves free to implement their own trust mechanism. 

Substrate modules, support for other signing methods than Ethereum Web3, and support for NFTs outside of the ERC-721 standard are planned.

The goal is that any bridge deployed on Mainnet/Rinkeby/Ropsten/Binance Chain/Moonbeam/Moonbase Alpha/Other EVM will be able to send NFTs to any parachain implementing the substrate module or an appropriate bridge smart contract.
Once this is achieved, substrate module to substrate module communication between parachain trough the relay chain will also be implemented.
Finally, more chains supporting NFTs (Wax, Flow) will be added to the migration ecosystem. Those might only be able to interact with the substrate module bridges, depending on the relevant technical challenges and limitations.


## Motivation
Decentralized blockchains allow you to truly own things trough your wallet without the need for third parties such as banks and other middlemen holding your assets for you, and NFTs are just the technical representation of unique assets on a blockchain. However, an NFT is always created in a single chain, and owners might want to move their unique assets to a different chain. How to transfer the NFT and the asset it represents from a token to another?

This is an open ended question with no correct answers, only compromises. Many solutions already exist, each with their own advantages and drawbacks, and more are poised to appear as time goes by. This could lead to issues: 
 
- Many competing and incompatible projects is an overload of information for users and marketplaces. A lack of transparency and understanding will lead to a lack of trust.
- Many projects are focusing on the decentralized proof of state of the owner "burning" a token and minting it in an another chain. However, without the consent of the NFT publisher content, the minted token could be considered a counterfeit. Marketplaces might not be willing to take that risk and will refuse to sell the privately minted token as the original, meaning that essentially the migration would have failed as the new ownership is not recognized by anyone else.

## Main bridge features

- Separates two concepts : A Bridge is a smart contract serving as an escrow/messaging system for NFT migrations (think of it as an airport 🛄), Relays are the one trusted by both token publishers and token owners to actually perform the migration (think of them as airlines ✈️).
- Can take tokens in escrow in order to mint a deed to them in an another chain.  
- Can give back tokens in escrow when the deed to them is reclaimed in the bridge the deed was minted.
- Allow token publishers to veto their token being represented as deeds by third parties.
- Can take tokens in escrow in order for the original token publisher to mint them in an another chain.
- Can give back tokens in escrow when the token to them is migrated back in a fashion defined by the original token publisher.
- Allow token publishers to specify the only allowed migration destinations for a proper cross-chain NFT migration as well as hooking callbacks for it.
- Can provably show declared previous owner intent to migrate.
- Allow token publishers to designate relays.
- Allow users to chose a relay.
- Allow NFT owners to migrate tokens in a single operation : allowing a relay as the token operator.

## Using the Neutrinos Platforms bridge

You can find an how to [here](USERHOWTO.md)

## Tests

You can run tests 

## More details 

This NFT bridge is based on the model described in "A protocol for NFT Migration", drafted as part of a Web3 Foundation grant:
https://docs.google.com/document/d/1c5Uor2By5igFWXimipcKhsWjTAG8OWrl9bSVWTPsi6U/edit?usp=sharing

## Sequence schema

![Bridge schema](https://user-images.githubusercontent.com/92730623/140541254-e1b6201a-bf2c-4814-bf66-ad6eafe9249c.png)

## Requirements

* NodeJS 12+ is supported
* Windows, Linux or macOS

## Being a relay

- You first need to either find a bridge already deployed on your target blockchains, or deploy one yourself. You can find the informations about deploying a bridge [here](BRIDGE.md)
- Then you need to depoy a Manipulator and a IOU (world) contract, you can find all the informations [here](MANIPULATOR.md)
- Then you can configure and launch the relay. All the informations are [here](RELAY.md)
- And lastly you must configure and launch a frontend server, [here](FRONTEND.md)

## Smart contract architecture

You can find all the interface of the smart contract [here](CONTRACT_ARCHI.md).

## Thanks to

The Web3 Foundation for supporting the creation of an NFT Migration protocol, which was the foundational work to build this NFT bridge, and to everyone who contributed to it.
