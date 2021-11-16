const Logger = require('../winston.js')('Ethereum')
const Web3 = require('web3')
const Conf = require('../../conf')
const ERC721Abi = require('../../abis/erc721')
const ERC165Abi = require('../../abis/erc165')
const BridgeAbi = require('../../abis/bridge')
const ERC721IOUAbi = require('../../abis/erc721IOU.json')
const EventEmitter = require('events')
const TransactionBalancer = require('./balancer.ethereum')
const TransactionBalancerNewGen = require('./balancerNewGen.ethereum')

class Ethereum extends EventEmitter {
    constructor(universe) {
        super()
        this.running = false
        this.rpc = universe.rpc
        this.web3Provider = new Web3.providers.WebsocketProvider(this.rpc, {
            clientConfig: {
                keepalive: true,
                keepaliveInterval: 60000
            },
            reconnect: {
                auto: true,
                delay: 5000,
                maxAttempts: 5,
                onTimeout: false
            }
        })
        this.web3Instance = new Web3(this.web3Provider)
        this.web3Wallet = this.web3Instance.eth.accounts.wallet.add(Conf.relayPrivateKey)
        this.web3Instance.eth.defaultAccount = this.web3Wallet.address
        this.balancer = new TransactionBalancerNewGen(universe, this.web3Instance);

        Logger.info(`Web3 ethereum querier instanciated on rpc ${this.rpc}`)
    }

    /**
     * Premint a token on the blockchain
     * @param {string} contractAddress : Address of the contract to interact with
     */
    async premintToken(contractAddress, bridgeAddress) {
        try{
            const contract = new this.web3Instance.eth.Contract(
                ERC721IOUAbi,
                contractAddress, 
                { from: this.web3Instance.eth.defaultAccount, gas: 8000000 }
            );
            const calldata = await contract.methods.premintFor(bridgeAddress).encodeABI();
            const txObject = {
                to: contractAddress,
                value: 0,
                data: calldata
            };
            const tx = await this.balancer.send(txObject);
            const tokenId = await contract.methods.mintedTokens().call()
            Logger.info(`Preminted a token on ${this.rpc} ! Transaction hash : "${tx.transactionHash}". Token id "${tokenId}".`)
            return tokenId
        }catch(err){
            throw err
        }
    }

    verifySignature(messageHash, signature) {
        return this.web3Instance.eth.accounts.recover(messageHash, signature);
    }

    async getProofOfEscrowHash(bridgeAddress, migrationHash) {
        this.running = true
        const web3Contract = new this.web3Instance.eth.Contract(
            BridgeAbi,
            bridgeAddress,
            {
                from: this.web3Instance.eth.defaultAccount,
                gas: 8000000
            }
        )
        const escrowHash = await web3Contract.methods.getProofOfEscrowHash(migrationHash).call();
        return escrowHash;
    }

    async safeTransferFrom(contract, from, to, tokenId) {
        this.running = true
        const web3Contract = new this.web3Instance.eth.Contract(
            ERC721Abi,
            contract,
            {
                from: this.web3Instance.eth.defaultAccount,
                gas: 8000000
            }
        )
        const calldata = await web3Contract.methods.safeTransferFrom(from, to, tokenId).encodeABI();
        const txObject = {
            to: contract,
            value: 0,
            data: calldata
        };
        const escrowHash = await this.balancer.send(txObject);
        return escrowHash
    }

    /* ==== Departure Bridge Interractions  ==== */
    migrateToERC721IOU(originBridge, migrationData) {
        return new Promise(async (resolve, reject) => {
            const web3Contract = new this.web3Instance.eth.Contract(
                BridgeAbi,
                originBridge,
                {
                    from: this.web3Instance.eth.defaultAccount,
                    gas: 8000000
                }
            )

            const data = [
                migrationData.originWorld,
                parseInt(migrationData.originTokenId),
                this.hexToBytes32(migrationData.destinationUniverse), // eg : "Moonbeam"
                this.hexToBytes32(migrationData.destinationBridge),
                this.hexToBytes32(migrationData.destinationWorld),
                this.numberToBytes32(migrationData.destinationTokenId),
                this.hexToBytes32(migrationData.destinationOwner),
                this.hexToBytes32(migrationData.originOwner)
            ];

            try {
                web3Contract.once('MigrationDeparturePreRegisteredERC721IOU', { 
                    filter: { 
                        _signee: this.hexToBytes32(migrationData.originOwner) 
                    } 
                }, async (err, data) => {
                    const migrationHash = data?.returnValues?._migrationHash;
                    if(migrationHash){
                        const block = await this.web3Instance.eth.getBlock(data.blockNumber);
                        resolve({
                            migrationHash,
                            blockTimestamp: block.timestamp
                        })
                        return
                    }
                    reject("Can't retrieve the migration hash")
                })
                try{
                    const calldata = await web3Contract.methods.migrateToERC721IOU(...data).encodeABI();
                    const txObject = {
                        to: originBridge,
                        value: 0,
                        data: calldata
                    };
                    await this.balancer.send(txObject);
                }catch(err){
                    console.log(err)
                }
            } catch(e) {
                reject(e)
            }
        })
    }

    async registerEscrowHashSignature(originBridge, migrationHash, escrowHashSigned) {
        const web3Contract = new this.web3Instance.eth.Contract(
            BridgeAbi,
            originBridge,
            {
                from: this.web3Instance.eth.defaultAccount,
                gas: 8000000
            }
        )
        const data = [
            migrationHash,
            escrowHashSigned
        ]
        const calldata = await web3Contract.methods.registerEscrowHashSignature(...data).encodeABI();
        const txObject = {
            to: originBridge,
            value: 0,
            data: calldata
        };
        await this.balancer.send(txObject);
    }

    /* ==== Arrival Bridge Interractions  ==== */
    async migrateFromIOUERC721ToERC721(originBridge, migrationData, migrationHashSignature, blockTimestamp) {
        const web3Contract = new this.web3Instance.eth.Contract(
            BridgeAbi,
            migrationData.destinationBridge,
            {
                from: this.web3Instance.eth.defaultAccount,
                gas: 8000000
            }
        )

        const data = [
            this.hexToBytes32(migrationData.originUniverse),
            this.hexToBytes32(originBridge),
            this.hexToBytes32(migrationData.originWorld),
            this.numberToBytes32(migrationData.originTokenId),
            this.hexToBytes32(migrationData.originOwner),
            migrationData.destinationWorld,
            parseInt(migrationData.destinationTokenId),
            migrationData.destinationOwner,
            migrationData.originOwner,
            this.numberToBytes32(blockTimestamp),
            migrationHashSignature
        ]
        const calldata = await web3Contract.methods.migrateFromIOUERC721ToERC721(...data).encodeABI();
        const txObject = {
            to: migrationData.destinationBridge,
            value: 0,
            data: calldata
        };
        const result = await this.balancer.send(txObject);    
        return result
    }

    async getTokenUri(contract, tokenId){
        const web3Contract = new this.web3Instance.eth.Contract(
            ERC721Abi,
            contract,
            {
                from: this.web3Instance.eth.defaultAccount,
                gas: 8000000
            }
        )

        return await web3Contract.methods.tokenURI(tokenId).call()
    }

    async setTokenUri(contract, tokenId, tokenUri){
        const web3Contract = new this.web3Instance.eth.Contract(
            ERC721IOUAbi,
            contract,
            {
                from: this.web3Instance.eth.defaultAccount,
                gas: 8000000
            }
        )

        const calldata = await web3Contract.methods.setTokenUri(tokenId, tokenUri).encodeABI();
        const txObject = {
            to: contract,
            value: 0,
            data: calldata
        };
        return await this.balancer.send(txObject);
    }

    /**
     * Utilities functions
     */
    async isErc721(contract) {
        try {
            const web3Contract = new this.web3Instance.eth.Contract(
                ERC165Abi,
                contract,
                {
                    from: this.web3Instance.eth.defaultAccount,
                    gas: 8000000
                }
            )
            return await web3Contract.methods.supportsInterface("0x80ac58cd").call() // ERC721 Identifier
        } catch(e) {
            return false;
        }
    }
    async isOwner(contract, tokenId, address) {
        try {
            const web3Contract = new this.web3Instance.eth.Contract(
                ERC721IOUAbi,
                contract,
                {
                    from: this.web3Instance.eth.defaultAccount,
                    gas: 8000000
                }
            )
            
            const ownerOf = (await web3Contract.methods.ownerOf(tokenId).call()).toLowerCase()
            address = address.toLowerCase()
            return (ownerOf == address)
        } catch(e) {
            return false;
        }
    }
    convertArrayToHex(arr) {
        return arr.map(elt => this.web3Instance.utils.asciiToHex(elt))
    }
    stringToBytes32(string) {
        return this.web3Instance.utils.padLeft(
            this.web3Instance.utils.asciiToHex(string), 64)
    }
    numberToBytes32(number) {
        return this.web3Instance.utils.padLeft(
            this.web3Instance.utils.numberToHex(
                this.web3Instance.utils.toBN(parseInt(number))), 64)
    }
    hexToBytes32(string) {
        return this.web3Instance.utils.padLeft(string, 64)
    }
    signMessage(data) {
        return this.web3Instance.eth.accounts.sign(data, Conf.relayPrivateKey);
    }
    hashMessage(data) {
        return this.web3Instance.eth.accounts.hashMessage(data);
    }

}

module.exports = Ethereum