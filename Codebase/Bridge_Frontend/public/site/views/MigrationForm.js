import AbstractView from './AbstractView.js';


/*******************************Read before modifying code
Inputs elements should be read only.
Therefore to modify the content of inputOGContractAddress, inputOGTokenID, inputDestOwner:
  call the functions set*InputValue("...")
Call the same function to modify the content of model.migrationData.[originWorld | originTokenId | destinationOwner]

These functions are used to modify the text displayed on the form AND migData object.
You must not modify migData.originOwner | destinationTokenId | migrationType directly, you should use these functions:
SetOriginOwner()
SetDestinationTokenId() + SetDestinationTokenIdFetchingMsg()
SelectMigrationButton()

****************************************************************************************/

//0xf181e8B385FE770C78e3B848F321998F78b0d73e
//0xbf21e21414554dB734C9f86835D51B57136BC35b
//Rinkeby ERC721 contract: 0x34797AaF0848b0f495cE413e551335362bc793eD (ImplTestERC721 depl by 0xbf2),
//    0x1cb3bb968c8a09907bfff181a07b57c3ce4ecda2 (IOUExmpl depl by 0xf18) ;
//    Old: 0xf609Ff037BdDA6749cf02651f04f584d8D51d276, 0x04f34D9Bb1595Bc50D90953DFb593348d87faea3
//Kovan ERC721 contract: 0x3551bc5fA3333937A8c555c66640141b432d63B0 ;
//    Old: 0x8eCE62F22Fd38C73CB356b395A6cd79Dc05D988C
//Token URI: https://cryptograph.co/tokenuri/0x2449835e86a539ab33f5773729c0db42e89016ff

export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("myNFT Bridge - Migration form");
  }

  /*This function contain all the javascript code which will be executed when this view if selected */
  async initCode(model){
    //Define global functions. Only for code reuse purpose.
    let bridgeApp = model.bridgeApp;
    let ABIS = model.ABIS;
    let contracts = model.contracts;
    let ogTokenMetaData = model.ogTokenMetaData;
    let migData = model.migrationData;
    //Account var represent the addr whith which the user is connected when clicking Fetch Data btn.
    //This var is not refreshed after this step on purpose.
    let userAccount = "";
    //Var indicating weather to send or not the getAvailableTokenId request. Set to true if receive "Too many requests"
    let holdOnTokenIdReq = false;

    //=====Load data from server=====
    //Load static files like conf and ABIs
    let loadNets = async function (_callback) {
        bridgeApp.networks = [];
        bridgeApp.net = {};

        let pathNetworksJson = '/network_list.json';
        try {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', pathNetworksJson);

            xhr.onload = function () {
                if (xhr.status != 200) { // analyze HTTP status of the response
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
                    alert("Could not load network list at " + pathNetworksJson);
                } else { // show the result
                    //console.log(`Done, got ${xhr.response}`); // responseText is the server
                    var resp = xhr.response;
                    bridgeApp.networks = JSON.parse(resp).networks;

                    //Create a mapping from networkUniqueID
                    for (var i = 0; i < bridgeApp.networks.length; i++) {
                        bridgeApp.net[bridgeApp.networks[i].uniqueId] = bridgeApp.networks[i];
                    } //You can now access Mainnet network data by calling bridgeApp.net.0x6d2f0e37


                    _callback();

                }
            };

            xhr.send();
        } catch (err) {
            console.log(err);
            alert("Could not load network list at " + pathNetworksJson);

        };
    };
    let loadRelays = async function(callback){
      bridgeApp.relays = [];

      let pathRelaysJson = '/relay_list.json';
      try {
          let xhr = new XMLHttpRequest();
          xhr.open('GET', pathRelaysJson);

          xhr.onload = function () {
              if (xhr.status != 200) { // analyze HTTP status of the response
                  console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
                  alert("Could not load relay list at " + pathRelaysJson);
              } else { // show the result
                  //console.log(`Done, got ${xhr.response}`); // responseText is the server
                  var resp = xhr.response;
                  bridgeApp.relays = JSON.parse(resp).relays;

                  callback();

              }
          };

          xhr.send();
      } catch (err) {
          console.log(err);
          alert("Could not load relay list at " + pathRelaysJson);

      };
    };
    let loadERC721ABI = async function (callback) {
        let pathERC721ABI = '/ABI/ERC721.json';
        try {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', pathERC721ABI);
            xhr.onload = function () {
                if (xhr.status != 200) { // analyze HTTP status of the response
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
                    alert("Could not load ERC721 ABI at " + pathERC721ABI);
                } else { // show the result
                    //console.log(`Done, got ${xhr.response}`); // responseText is the server
                    var resp = xhr.response;
                    ABIS.ERC721 = JSON.parse(resp).abi;

                    callback();
                }
            };
            xhr.send();
        } catch (err) {
            console.log(err);
            alert("Could not load ERC721 ABI at " + pathERC721ABI);
        };
    };
    let loadERC721MetadataABI = async function (callback) {
        let pathERC721Metadata = '/ABI/ERC721Metadata.json';
        try {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', pathERC721Metadata);
            xhr.onload = function () {
                if (xhr.status != 200) { // analyze HTTP status of the response
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
                    alert("Could not load ERC721Metadata ABI at " + pathERC721Metadata);
                } else { // show the result
                    //console.log(`Done, got ${xhr.response}`); // responseText is the server
                    var resp = xhr.response;
                    ABIS.ERC721Metadata = JSON.parse(resp).abi;

                    callback();
                }
            };
            xhr.send();
        } catch (err) {
            console.log(err);
            lert("Could not load ERC721Metadata ABI at " + pathERC721Metadata);
        };
    };
    let loadERC165ABI = async function (callback) {
        let pathERC721Metadata = '/ABI/ERC165.json';
        try {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', pathERC721Metadata);
            xhr.onload = function () {
                if (xhr.status != 200) { // analyze HTTP status of the response
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
                    alert("Could not load ERC165 ABI at " + pathERC721Metadata);
                } else { // show the result
                    //console.log(`Done, got ${xhr.response}`); // responseText is the server
                    var resp = xhr.response;
                    ABIS.ERC165 = JSON.parse(resp).abi;

                    callback();
                }
            };
            xhr.send();
        } catch (err) {
            console.log(err);
            lert("Could not load ERC165 ABI at " + pathERC721Metadata);
        };
    };
    //Return true if all above data from server are loaded
    let areDataLoadedFromServer = function(){
      return bridgeApp.networks.length  > 0 && bridgeApp.relays.length  > 0;
    }

    //=====Provider management=====
    //Change the originNet dropDown selected item + Fetch new token data if possible
    let changeOriginNetworkAndFetchTokenData = async function(ethNetId){
      console.log("changeOriginNetworkAndFetchTokenData(" + ethNetId + ')');
      //Retrieve the network index associated with ethNetId
      let netIndex = -1;
      bridgeApp.networks.forEach((univ, i) => {
        if(parseInt(univ.networkID) == parseInt(ethNetId)){netIndex = i;}
      });
      if(netIndex < 0){
        console.log("Change ogNet & fetch: " + ethNetId + " networkId not found.");
        console.log("bridgeApp:");
        console.log(bridgeApp.networks);

        //Unselect ogNet
        unselectDropDown("OriginNetworkSelector");
        //Display unsupported net msg
        displayOgNetworkSwitchMsg("Your provider's network is not yet supported. Drop us a message to request it.");
        return;
      }
      else {
        showCardLine("OgNetworkSwitchMessage", false);
      }

      //Save origin network in the object migData to access it later during the migration process
      migData.originUniverseIndex = netIndex;
      migData.originUniverse = bridgeApp.networks[migData.originUniverseIndex].name;
      migData.originUniverseUniqueId = bridgeApp.networks[migData.originUniverseIndex].uniqueId;
      migData.originNetworkId = bridgeApp.networks[migData.originUniverseIndex].networkID;

      //Change dropdown selected item
      if(getDropDownSelectedOptionIndex("OriginNetworkSelector") != netIndex)
        selectDropDownOptionByIndex("OriginNetworkSelector", netIndex);

      //Clear previous token data
      clearTokenData();

      //Clear and hide Dest data
      if(!model.editMigrationForm){clearDestDataOnOgNetChanged();}

      //Show next form field
      showCardLine("OriginWorldCardLine", true);
      showCardLine("OriginTokenIDCardLine", migData.originWorld != "");

      //Dest network
      //Clear Destination networks before fill it again
      clearDropDownOptions("DestinationNetworkSelector");
      console.log("DestinationNetworkSelector cleared");
      //Clear previously retrieved destWorld
      clearDropDownOptions("DestinationWorldSelector");
      //Show the available destination networks for the ogNet selected
      for(const target of bridgeApp.networks[migData.originUniverseIndex].targetList){
        let destNetId = target.networkId
        let targetNet = {};
        for(const network of bridgeApp.networks){
          if(network.networkID == destNetId)
            targetNet = network;
        }
        addDropDownOption("DestinationNetworkSelector", targetNet.name, "", targetNet.uniqueId);
      }

      //If migData already filled, prefill migration form
      //Once wallet loaded, chain is switched, and dest net loaded:
      //we can prefill all form data if user come from register_mig & clicked edit btn
      console.log("isMigDataFilled(): " + model.isMigDataFilled());
      if(model.isMigDataFilled()){prefillFormWithMigData();}
      else if(migData.originWorld && migData.originTokenId){//if data filled, fetch token data
        document.getElementById("FetchDataButton").click();//Will reset model.editMigrationForm
      }

      //If world is filled, refresh IsERC-721 msg
      if(migData.originWorld){
        //Refresh isERC-721 message within the new network
        isOgContractERC721().then(function(isERC721){
          //Show ERC721 compliant MSG & adapt text
          showIsERC721CompliantMsg(migData.originWorld != "", isERC721);
        });
      }

    }
    //Define functions which interact with blockchains or wallet
    //Prompt the user to change his wallet network.
    //If success (accepted by user) -> fetch new token data if og world & tokenId filled
    //If canceled -> change OgNetowrk dropdown to current wallet network
    let promptSwitchChainDataToFetch = async function (ID) {
      window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ID}], // chainId must be in hexadecimal numbers
      }).then((res) =>{
        console.log("Network switched to " + ID + ". (DataToFetch)");
        changeOriginNetworkAndFetchTokenData(ID);
      }).catch((res) => {
        console.log("Network switch canceled or error. (DataToFetch): " + JSON.stringify(res));
        setOgNetDropDownToWalletNet();
      });
    }
    //Prompt the user to change his wallet network.
    //If success (accepted by user) -> ogNet dropdown & wallet net are now the same and
    //correspond to the token data already fetched. Do nothing.
    //If canceled -> change OgNetowrk dropdown to current wallet network + Fetch tokenData
    let promptSwitchChainFetchedData = async function (ID) {
      window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ID}], // chainId must be in hexadecimal numbers
      }).then((res) =>{
        console.log("Network switch done. (FetchedData)");
        //Nothing to do as token data are already fetched.
        //Just hide "Please change net" message
        showCardLine("OgNetworkSwitchMessage", false);
      }).catch((res) => {
        console.log("Network switch canceled or error. (FetchedData)");

        //If request is not pending
        if(res.code != -32002){
          showCardLine("OgNetworkSwitchMessage", false);
          //retrive the netId of the network before prompt switch (which is the same as after as the user canceled the prompt)
          let currentProviderNetId = window.web3.currentProvider.chainId;
          changeOriginNetworkAndFetchTokenData(currentProviderNetId);
        }
      });
    }

    //=====Token Management=====
    //Load a token metadata from chain
    let loadOgTokenData = async function () {

        //First we check that we have a connected wallet
        if (window.ethereum == undefined) {
            alert("Please connect to a Wallet first");
            return;
        }

        if (window.web3.currentProvider.selectedAddress == null) {
            alert("Please connect to a Wallet first");
            return;
        }

        //Instanciate an ERC721 contract at the address
        try{
          contracts.originalChainERC721Contract = new window.web3.eth.Contract(ABIS.ERC721, document.getElementById("inputOGContractAddress").value);
          contracts.originalChainERC721MetadataContract = new window.web3.eth.Contract(ABIS.ERC721Metadata, document.getElementById("inputOGContractAddress").value);
        }
        catch(err){
          console.log("Contract instanciation error: " + err);
          displayContractErrorMsg();
          return;
        }

        //Check if ERC721 contract
        let isERC721 = await isOgContractERC721();
        if(!isERC721){
          console.log("This contract is NOT ERC721 compliant.");
          showIsERC721CompliantMsg(true, false);
          //Hide redeem network hint as token is not an IOU
          displayRedeemNetworkHintMsg(false);

          return;
        }else {
          console.log("This contract is ERC721 compliant.");
          //Hide the message (Useful if fetch data triggered by network change, and thus no onchange triggered for ogWorl input which would hide the msg)
          showIsERC721CompliantMsg(true, true);
        }

        //Display token data card
        showCardLine("TokenDataCard", true);
        showCardLine("MigrationCard", true);
        showCardLine("DestNetworkCardLine", true);
        showCardLine("BreakLineCardContainer", true);
        showCard("CompleteMigrationCard", true);//Display complete button

    	  //Get the Contract Name
        let getContractName = async function () {
          let content = "";
          try {
      			content = await contracts.originalChainERC721MetadataContract.methods.name().call();
          } catch (err) {
      			//console.log(err);
      			console.log("Could not get name() for: contractAddress " + contracts.originalChainERC721MetadataContract._address + "   tokenID: " + document.getElementById("inputOGTokenID").value);
      		}

          //Display or not the html element
          if(content != ""){
            document.getElementById("OGContractName").innerHTML = content;
            showCardLine("OriginWorldNameCardLine", true);
          } else {
            showCardLine("OriginWorldNameCardLine", false);
          }
        }
        getContractName();

    	  //Get the Contract Symbol
        let getContractSymbol = async function () {
          let content = "";
          try {
      			content = await contracts.originalChainERC721MetadataContract.methods.symbol().call();
          } catch (err) {
      			//console.log(err);
      			console.log("Could not get symbol() for: contractAddress " + contracts.originalChainERC721MetadataContract._address + "   tokenID:" + document.getElementById("inputOGTokenID").value);
      		}
          //Display or not the ctrc symbol
          if(content != ""){
            document.getElementById("OGContractSymbol").innerHTML = content;
            showCardLine("OriginWorldSymbolCardLine", true);
          } else {//Else hide the contract symbol line
            showCardLine("OriginWorldSymbolCardLine", false);
          }
        }
        getContractSymbol();

        //Get the Token owner
        let getTokenOwner = async function () {
          let content = "";
          try {
      			content = await contracts.originalChainERC721Contract.methods.ownerOf(document.getElementById("inputOGTokenID").value).call();
          } catch (err) {
      			//console.log(err);
      			console.log("Could not get ownerOf() for: contractAddress " + contracts.originalChainERC721Contract._address + "   tokenID:" + document.getElementById("inputOGTokenID").value);
      		}

          //Display or not the owner
          if(content != ""){
            //Add origin token owner to migData & display it
            setOriginOwner(content.toLowerCase());
            //Show og owner card line
            showCardLine("OriginTokenOwnerCardLine", true);
            //display not owner msg depending on the connected addr & tok owner
            checkAndDisplayNotOwnerMsg();
          } else {
            showCardLine("OriginTokenOwnerCardLine", false);
            //Reset og owner
            setOriginOwner("");
            //Inform user that no owner was found on this NFT
            displayNoOwnerMsg();
            refreshCompleteBtnEnabled();
          }
        }
        getTokenOwner();

    	  //Get the Token URI
        let getTokenURI = async function () {
          let content = "";
          try {
      			content = await contracts.originalChainERC721MetadataContract.methods.tokenURI(document.getElementById("inputOGTokenID").value).call();
          } catch (err) {
      			//console.log(err);
      			console.log("Could not get tokenURI() for: contractAddress " + contracts.originalChainERC721MetadataContract._address + "   tokenID:" + document.getElementById("inputOGTokenID").value);
      		}

          if(content != ""){
            //Display tokenURI
            document.getElementById("OGTokenURI").innerHTML = content;
            document.getElementById("OGTokenURI").href = content;
            console.log("TokenURI: " + content);
            showCardLine("OriginTokenURICardLine", true);

            //Load and display metadata from JSON file
            //Show token metadata attributes
            showCard("MetadataCard", true);
            //Display "Fetching..." message
            setOriginTokenName("", true);
            document.getElementById("OGTokenMetaDesc").textContent = "Fetching...";
            document.getElementById("OGTokenMetaImagePath").innerHTML = "Fetching...";
            //Load metadata from tokenURI
            loadOgTokenMetaData();
          } else {
            //Hide TokenURI display
            showCardLine("OriginTokenURICardLine", false);
            //Hide all metadata fields display
            showCard("MetadataCard", false);
            //Unselect redeem button if it was selected
            unselectMigrationButtons();
            //Hide redeem network hint as token is not an IOU
            displayRedeemNetworkHintMsg(false);
          }
        }
        getTokenURI();
    };
    //Load token metadata from TokenURI
    let loadOgTokenMetaData = async function () {
      let OGTokenMetadataPath = document.getElementById("OGTokenURI").innerHTML;

      if(OGTokenMetadataPath == "Not Specified" || OGTokenMetadataPath == null){
          return;
      } else {
          try {
              let xhr = new XMLHttpRequest();
              console.log("XHR on " + OGTokenMetadataPath);
              xhr.open('GET', OGTokenMetadataPath);
              xhr.onload = function () {
                  if (xhr.status != 200) { // analyze HTTP status of the response
                      console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
                      alert("Could not load network list at " + pathERC721Metadata);
                  } else { // show the result
                      //console.log(`Done, got ${xhr.response}`); // responseText is the server
                      var resp = xhr.response;
                      ogTokenMetaData = JSON.parse(resp);
                      console.log(resp);

                      //If token is an IOU, extract data from the json metadata file into migData object
                      if(isIOUToken(ogTokenMetaData)){
                        console.log("This token is an IOU of token " + ogTokenMetaData.migrationData.originTokenId + ", from world " + ogTokenMetaData.migrationData.originWorld + " from universe " + ogTokenMetaData.migrationData.originUniverse);

                        //Save all data from NFT => IOU migration into migData
                        migData.metadataDestinationUniverseUniqueId  = ogTokenMetaData.migrationData.originUniverse;
                        //retrieve the index & name of the universe from its uniqueID
                        bridgeApp.networks.forEach((univ, i) => {
                          if(univ.uniqueId == migData.metadataDestinationUniverseUniqueId){
                            migData.metadataDestinationUniverseIndex = i;
                            migData.metadataDestinationUniverse = univ.name;
                          }
                        });

                        migData.metadataDestinationWorld  = ogTokenMetaData.migrationData.originWorld;
                        migData.metadataDestinationTokenId  = ogTokenMetaData.migrationData.originTokenId;
                        migData.metadataDestinationBridgeAddr = bridgeApp.networks[Math.max(0, migData.metadataDestinationUniverseIndex)].bridgeAdress

                        //Show network hint to redeem IOU
                        displayRedeemNetworkHintMsg(true);
                      }
                      else{
                        //Hide redeem network hint as token is not an IOU
                        displayRedeemNetworkHintMsg(false);

                        //If token is not IOU, unselect Redeem if previously selected
                        //Do not modify migrationType if user just come from edit migration form.
                        if(!model.editMigrationForm && migData.migrationType == model.RedeemIOUMigrationType){
                          unselectMigrationButtons();
                        }
                      }

                      document.getElementById("OGTokenMetaDesc").textContent = ogTokenMetaData.description;
                      //Display & save ogTokenName to migData
                      setOriginTokenName(ogTokenMetaData.name, false);

                      //Set destination token name if Mint IOU is selected
                      if(migData.migrationType == model.MintOUIMigrationType){
                        setDestTokenName(true, 'IOU of ' + migData.originTokenName);
                      }

                      //Img loading
                      let ext4 = ogTokenMetaData.image.substr(ogTokenMetaData.image.length - 4).toLowerCase();
                      /*console.log("ext4:");
                      console.log(ext4);
                      console.log("isIOU: " + isIOUToken(ogTokenMetaData));
                      console.log("xhr: ");
                      console.log(xhr);*/

                      if(isIOUToken(ogTokenMetaData) || ext4 == ".png" || ext4 == ".jpg" || ext4 == "jpeg" || ext4 == ".gif" || ext4 == "webp" || ext4== ".svg" || ext4 == "jfif"){
                          document.getElementById("OGTokenMetaImagePath").innerHTML = '<br><img class="imgassetpreview" src="' + encodeURI(ogTokenMetaData.image) +'">';
                      }/*else if(ext4 == ".mp4"){
                        document.getElementById("OGTokenMetaImagePath").innerHTML =
                        `<video class="videoPlayer" controls autoplay muted loop>
                          <source src="` + encodeURI(ogTokenMetaData.image) + `" type="video/mp4">
                          Your browser does not support the video tag.
                        </video>`
                      }*/
                      else if(ogTokenMetaData.image != null) {
                          document.getElementById("OGTokenMetaImagePath").innerHTML = '<a href="' + encodeURI(ogTokenMetaData.image) + '">' + encodeURI(ogTokenMetaData.image) + '</a>';
                      }

                      //enable or not redeem btn depending on the type of token (iou or not)
                      enableRedeemBtnIfNetworkMatch();
                  }
              };
              xhr.send();
          } catch (err) {
              console.log(err);
              alert("Could not ERC721Metadata ABI at " + pathERC721Metadata);
          };
      }
    };
    //Load destination token URI + display token name
    let getDestTokenURIAndDisplayTokenName = async function(){
      let selectedRelayIndex = migData.migrationRelayIndex;
      let relayURL = bridgeApp.relays[selectedRelayIndex].url;

      var options = {
        method: 'POST',
        url: '',
        headers: {'Content-Type': 'application/json'},
        data: {}
      };
      options.url = relayURL + '/getTokenUri';
      options.data.universe = migData.destinationUniverseUniqueId;
      options.data.world = migData.destinationWorld;
      options.data.tokenId = migData.destinationTokenId;

      axios.request(options).then(function (response) {
        if(response.status == 200){
          let tokenURI = response.data.tokenUri;
          console.log("Destination token URI: " + tokenURI);

          //Load token metadata + display name
          loadDestTokenMetadata(tokenURI);
        }else{
          displayDestTokenNameMsg("Could not retrieve the token's URI. Please contact our team to report the bug.");
          console.log("Could not get tokenURI() for: contractAddress " + migData.destinationWorld + "   tokenID:" + migData.destinationTokenId);
          console.log(response.status + ' : ' + response.statusText);
        }
      }).catch(function (error) {
        displayDestTokenNameMsg("Relay is not responding. Please contact our team to report the bug.");
        console.log("Could not get tokenURI() for: contractAddress " + migData.destinationWorld + "   tokenID:" + migData.destinationTokenId);
      });
    }
    //Load destination token metadata + display dest token name
    let loadDestTokenMetadata = function(URI){
      //create get request
      var options = {
        method: 'GET',
        url: URI,
        headers: {'Content-Type': 'text/json'}
      };

      let requestCallback = function(response){
        if(response.status == 200){
          let metadata = response.data;
          //Display token Name & save it to migData
          if(metadata.name){
            //Save token name in migData
            migData.destinationTokenName = metadata.name;

            setDestTokenName(true, metadata.name);
          } else {
            displayDestTokenNameMsg("Couldn't retrieve the original token's name. Please contact our team to report the bug.");
          }
        }else{
          displayDestTokenNameMsg("An error occured to retrieve the original token's name. Please contact our team to report the bug.");
          console.log(response.status + ' : ' + response.statusText);
        }
      }

      //Execute request
      axios.get(URI, options).then(function (response) {
        requestCallback(response);
      }).catch(function (error) {
        displayDestTokenNameMsg("An error occured to retrieve the original token's name. Please contact our team and report the bug.");
        console.error(error);
      });

    }
    //Check if the metadata json file represent an IOU
    let isIOUToken = function(metadata){
      if(metadata != null && metadata != undefined){
        return metadata.migrationData != undefined
        && metadata.migrationData.originUniverse != undefined
        && metadata.migrationData.originWorld != undefined
        && metadata.migrationData.originTokenId != undefined;
      }else{
        return false;
      }
    }
    //Return weather the og world is an ERC721 contract
    let isOgContractERC721 = async function(){
      //First we check that we have a connected wallet
      if (window.ethereum == undefined) {
          alert("Please connect to a Wallet first");
          return false;
      }

      if (window.web3.currentProvider.selectedAddress == null) {
          alert("Please connect to a Wallet first");
          return false;
      }

      //Second, instanciate the contract through ERC165
      try{
        contracts.originalChainERC165Contract = new window.web3.eth.Contract(ABIS.ERC165, document.getElementById("inputOGContractAddress").value);
      }
      catch(err){
        console.log("Contract ERC165 instanciation error: " + err);
        return false;
      }

      //Then call supportsInterface()
      let isERC721;
      try{
        isERC721 = await contracts.originalChainERC165Contract.methods.supportsInterface("0x80ac58cd").call();
      }catch(err){
        console.log("Call to supportsInterface() from contract ERC165 error: " + JSON.stringify(err));
        return false;
      }
      return isERC721;
    }

    //=====Relay's interaction=====
    //Query relay for list of dest worlds available for the destination network selected
    //And display it into dropDown.
    //Display Fetching... text or Too many request while waiting tokenId
    let getRelayAvailableWorlds = async function(){
      let selectedRelayIndex = migData.migrationRelayIndex;
      let relayURL = bridgeApp.relays[selectedRelayIndex].url;

      var options = {
        method: 'POST',
        url: '',
        headers: {'Content-Type': 'application/json'},
        data: {universe: ''}
      };
      options.url = relayURL + '/getAvailableWorlds';
      options.data.universe = migData.destinationUniverseUniqueId;

      axios.request(options).then(function (response) {
        //Add dest world available to dropdown and model.bridgeApp
        console.log("Available worlds: " + response.data.worlds);
        if(response.status == 200 && response.data.worlds){
          //Add all destWorlds to dropDown
          bridgeApp.destWorlds = [];
          response.data.worlds.forEach((worldAddr, i) => {
            bridgeApp.destWorlds.push(worldAddr);
            //Add world to drop down
            addDropDownOption("DestinationWorldSelector", worldAddr, "", i);
          });

          //Prefill with the 1st world
          if(response.data.worlds.length > 0){
            selectDropDownOptionByIndex("DestinationWorldSelector", 0);
            //Display other form fields as if user clicked on the dropdoen option
            triggerDropDownOnChange("DestinationWorldSelector");
          }
        }
      }).catch(function (error) {
        console.error(error);
      });
    }
    let getAvailableTokenId = async function(){
      let selectedRelayIndex = migData.migrationRelayIndex;
      let relayURL = bridgeApp.relays[selectedRelayIndex].url;

      var options = {
        method: 'POST',
        url: '',
        headers: {'Content-Type': 'application/json'},
        data: {}
      };
      options.url = relayURL + '/getAvailableTokenId';
      options.data.universe = migData.destinationUniverseUniqueId;
      options.data.world = migData.destinationWorld;

      //Send request if "too many request" not received
      if(!holdOnTokenIdReq){
        //Display loading text for tokenID
        setDestinationTokenIdWaitMsg("Fetching...");

        axios.request(options).then(function (response) {
          if(response.status != 200){console.log(response.status + response.statusText);}
          //If redeem button is selected when response is received, do not take it into account
          if(migData.migrationType != model.RedeemIOUMigrationType){
            console.log("Available tokenId: " + response.data.tokenId);

            //Save & display tokenID into migData
            setDestinationTokenId(response.data.tokenId);

            //Refresh complete btn
            refreshCompleteBtnEnabled();
          }
        }).catch(function (error) {
          //Block any new request from being sent
          console.log("Too many requests");
          holdOnTokenIdReq = true;
          console.error(error);
          //If "Too many requests", wait one minute before resending request
          //Display loading text for tokenID
          setDestinationTokenIdWaitMsg("Too many request to relay. Please wait 1 min...");
          setTimeout(function(){
            //Timeout elapsed
            holdOnTokenIdReq = false;
            getAvailableTokenId();
          }, 60000);

          //Refresh complete button
          refreshCompleteBtnEnabled();
        });
      }
      else {
        setDestinationTokenIdWaitMsg("Too many request to relay. Please wait 1 min.");
      }
    }

    //=====Provider management=====
    //Display connected addr + disco btn + ogNet + prefill ogNet
    //This function requires the provider to be loaded (wallet connected)
    //This function requires the network data (network_list.json) to be loaded from server
    let displayConnectedWallet = function(){
      console.log("displayConnectedWallet()");
      //When this function is called, the wallet-provider is connected
      //Display connected account addr
      document.getElementById("ConnectedAccountAddr").textContent = userAccount;

      //Display wallet name
      let providerName = localStorage.getItem("provider");
      if(!providerName){return;}
      //Set first char to upperCase
      providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);
      //Display it on html element
      if(providerName){document.getElementById("ConnectedWalletName").textContent = providerName;}
      else{document.getElementById("ConnectedWalletName").textContent = "No wallet connected.";}

      //Show origin network drop down
      showCard("DepartureCard", true);
      showCardLine("OriginNetworkCardLine", true);
      showCard("CompleteMigrationCard", true);

      //If Network list loaded from web server: prefill origin network (If not already prefilled)
      console.log(areDataLoadedFromServer() + ', ' + migData.originUniverse);
      //migData.originUniverse != "" : is the case when user comde back from register & edit btn
      if(areDataLoadedFromServer() || migData.originUniverse != ""){
        let providerNetId = window.web3.currentProvider.chainId;
        changeOriginNetworkAndFetchTokenData(providerNetId);
      }

      //Setup onChainChanged event listener.
      window.ethereum.on('chainChanged', (chainId) => {
				// The metamask provider emits this event when the currently connected chain changes.
				// All RPC requests are submitted to the currently connected chain. Therefore, it's critical to keep track
				// of the current chain ID by listening for this event.
				// We strongly recommend reloading the page on chain changed, unless you have good reason not to.
				console.log("*** Event chainChanged to " + chainId + " emmited ***");

        //Auto switch the ogNet to provider net if window is focused
        if(!document.hidden){
          //Automatically change the form ogNet & retrieve data if destNet is not already set.
          //This prevent token data from changing after the user is filling the destnations data
          if(!migData.destinationUniverseIndex)
            changeOriginNetworkAndFetchTokenData(chainId);
        }
			});
    }
    //autoconnect to metamask if injected
    let connectToMetamask = async function () {
      //set callback function called when a wallet is connected
      //HERE connectionCallback undefined because provider not loaded yet
      connectionCallback = function(){
        console.log("Wallet connected");
        //Refresh connected addr
        userAccount = window.web3.currentProvider.selectedAddress;
        //Display connected addr + ogNet & prefill it
        displayConnectedWallet();
      };

      //Connecting to metmask if injected
      if (window.web3.__isMetaMaskShim__ && window.web3.currentProvider.selectedAddress != null) {
          if (connector == null || !connector.isConnected) {
              connector = await ConnectorManager.instantiate(ConnectorManager.providers.METAMASK);
              connectedButton = connectMetaMaskButton;
              providerConnected = "MetaMask";
              connection();
          } else {
              connector.disconnection();
          }
      }
      else{
        console.log("Metamask not injected. Redirecting to wallet_connection page.");
        model.navigateTo('wallet_connection');
        return;//To stop javascript execution in initCode() function
      }
    }

    //=====Display functions=====
    let hideFieldAfterDestNetwork = function(){
      showCardLine("MigrationTypeCardLine", false);
      showCardLine("MigTypeDescriptionMessage", false);
      showCardLine("MigrationRelayCardLine", false);
      showCardLine("DestWorldRedeemCardLine", false);
      showCardLine("DestWorldCardLine", false);
      showCardLine("DestWorldNameCardLine", false);
      showCardLine("DestWorldSymbolCardLine", false);
      showCardLine("DestTokenIdCardLine", false);
      showCardLine("DestOwnerCardLine", false);
      setDestTokenName(false, "");
    }
    let clearDestDataOnOgNetChanged = function(){
      //Hide form fields after destNetwork.
      hideFieldAfterDestNetwork();

      //Clear dest networks + world
      clearDropDownOptions("DestinationNetworkSelector");
      clearDropDownOptions("DestinationWorldSelector");

      //Reset migData dest var
      migData.destinationUniverseIndex = 0;//Index in network_list "networks" array
      migData.destinationUniverseTargerListIndex = 0;//Index in network_list "neworks.targetList" array
      migData.destinationUniverseUniqueId = "";
      migData.destinationUniverse = "";
      migData.destinationBridgeAddr = "";
      migData.destinationWorld = "";

      //Reset btn & disable redeem
      unselectMigrationButtons();
      disableRedeemBtn(true);

      //Unselect relay
      unselectDropDown("RelaySelector");

      //Reset dest token ID
      setDestinationTokenId("");

      //Reset token name
      setDestTokenName(false, "");
    }
    //Clear origin token display & migData
    let clearTokenData = function(){
      showCardLine("TokenErrorMessage", false);
      showTokenData(false);

      document.getElementById("OGContractName").innerHTML = "";
      document.getElementById("OGContractSymbol").innerHTML = "";
      setOriginOwner("");
      setOriginTokenName("", false);
      document.getElementById("OGTokenURI").innerHTML = "";
      document.getElementById("OGTokenMetaDesc").textContent = "";
      document.getElementById("OGTokenMetaImagePath").innerHTML = "";

      //Also disable redeem button by default
      disableRedeemBtn(true);

      //Clear token metadata. (if previous token was an IOU)
      resetTokenMetadata();
    }
    let showTokenData = function(show){
      showCardLine("OriginWorldNameCardLine", show);
      showCardLine("OriginWorldSymbolCardLine", show);
      showCardLine("OriginTokenOwnerCardLine", show);
      showCardLine("OriginTokenURICardLine", show);
      showCardLine("MetadataCard", show);
    }
    //Show - Hide from dest network to dest owner
    let showArrivalFormFieldsOnRedeem = function(show){
      let elementsToShow = document.querySelectorAll("#ArrivalCard,#DestNetworkCardLine,#DestWorldRedeemCardLine,#DestTokenIdCardLine,#DestTokenNameCardLine,#DestOwnerCardLine");
      elementsToShow.forEach(function(elem) {
        showCard(elem.id, show);
      });

      //Only for DestinationWorldSelector, hide it if show == true | false. Cuz we're showing redeem form field
      showCardLine("DestWorldCardLine", false);
    }
    let showFormFieldsAfterMigButtons = function(show){
      let elementsToHide = document.querySelectorAll("#MigrationRelayCardLine,#ArrivalCard,#DestWorldCardLine,#DestWorldRedeemCardLine,#DestWorldNameCardLine,#DestWorldSymbolCardLine,#DestTokenIdCardLine,#DestTokenNameCardLine,#DestOwnerCardLine");
      elementsToHide.forEach(function(elem) {
        showCard(elem.id, show);
      });
    }
    let showFormFieldsAfterRelay = function(show){
      //Hide further form field if ever displayed
      let elementsToHide = document.querySelectorAll("#ArrivalCard,#DestWorldCardLine,#DestTokenIdCardLine,#DestTokenNameCardLine,#DestOwnerCardLine");
      elementsToHide.forEach(function(elem) {
        showCard(elem.id, show);
      });
    }
    //Show all form fields, and show the right destWorld element (selector + text) depending on migData.migrationType
    let showAllFormFields = function(){
      //Show all cards
      let cardsToShow = document.querySelectorAll("#DepartureCard,#TokenDataCard,#MigrationCard,#ArrivalCard,#CompleteMigrationCard");
      cardsToShow.forEach(function(elem) {
        showCard(elem.id, true);
      });
      //Show all cardLines
      let cardLinesToShow = document.querySelectorAll("#OriginNetworkCardLine,#OriginWorldCardLine,#OriginTokenIDCardLine,#MigrationTypeCardLine,#MigrationRelayCardLine,#DestNetworkCardLine,#DestTokenIdCardLine,#DestTokenNameCardLine,#DestOwnerCardLine");
      cardLinesToShow.forEach(function(elem) {
        showCardLine(elem.id, true);
      });

      //Display destWorld element depending on the mig type
      if(migData.migrationType == model.RedeemIOUMigrationType){
        showCardLine("DestWorldRedeemCardLine", true);
      }
      else {
        showCardLine("DestWorldCardLine", true);
      }
    }

    //=====Error & user messages=====
    let displayDestTokenNameMsg = function(txt){
      showCardLine("DestTokenNameCardLine", true);
      document.getElementById("DestTokenName").innerHTML = txt;
      migData.destinationTokenName = "";
    }
    let displayRedeemNetworkHintMsg = function(show){
      let elem = document.getElementById("RedeemOUINetworkMsg");
      //show elem
      showCardLine(elem.id, show);

      //Set the text
      elem.textContent = "The original token of this IOU is in the network " + migData.metadataDestinationUniverse + ". You need to select this network to redeem the IOU.";
    }
    let displayOgNetworkSwitchMsg = function(txt){
      let errorMsg = document.getElementById("OgNetworkSwitchMessage");
      errorMsg.innerHTML = txt;
      showCardLine("OgNetworkSwitchMessage", true);
    }
    //Token error msg, same as contract error. Display error msg below tokenID input.
    let displayErrorMsg = function(txt){
      let errorMsg = document.getElementById("TokenErrorMessage");
      errorMsg.innerHTML = txt;
      //Show error msg
      showCardLine("TokenErrorMessage", true);
    }
    let checkAndDisplayNotOwnerMsg = function(){

      //Handle if user is not the owner
      if(userAccount != migData.originOwner){
        console.log("Connected addr: " + userAccount + " != token owner: " + migData.originOwner);
        displayErrorMsg("You are not the owner of this NFT. You can't migrate it.");
      }
      //Refresh complete btn
      refreshCompleteBtnEnabled();
    }
    let displayNoOwnerMsg = function(){
      displayErrorMsg("No owner could be found for this NFT.<br>Make sure you have selected to origin network that match where the contract is deployed.");
      //Hide destination token name
      setDestTokenName(false,"");
    }
    let displayContractErrorMsg = function(){
      displayErrorMsg("This contract couldn't be found. Make sure you filled in a correct contract address.");
      //Hide destination token name
      setDestTokenName(false,"");
    }
    //Show the text message element if show is true. And  adapt the message depending on isCompliant
    let showIsERC721CompliantMsg = function(show, isCompliant){
      //Show ERC721 compliant MSG
      showCardLine("OgContractERC721CompliantMsgCardLine", show);

      //Change MSG if ERC721 compliant or not
      let ERC721Msg = document.getElementById("OgContractERC721CompliantMsgCardLine");
      if(isCompliant){
        ERC721Msg.textContent = "This contract is ERC721 compliant. Perfect!";
        //Add standard styling
        ERC721Msg.classList.remove('ErrorTextStyle');
        ERC721Msg.classList.add('DataText');
      }
      else{
        ERC721Msg.textContent = "You can't migrate tokens from this contract, it must be ERC721 compliant.";
        //Add error styling
        ERC721Msg.classList.remove('DataText');
        ERC721Msg.classList.add('ErrorTextStyle');
        //Hide destination token name
        setDestTokenName(false,"");
      }
    }
    //Show a message describing the migration type selected if show is true.
    //The message is different depending on the modelMigType
    //which can be Model.MintOUIMigrationType or Model.RedeemIOUMigrationType
    let showMigrationTypeDescription = function(show, modelMigType){
      //Show the message element
      showCardLine("MigTypeDescriptionMessage", show);

      //Set the right text to the element depending on the migType
      switch(modelMigType){
        case model.MintOUIMigrationType:
          document.getElementById("MigTypeDescriptionMessage").textContent = "Minting an IOU of your NFT will create a new token that you can trade within the destination network.";
        break;

        case model.RedeemIOUMigrationType:
          document.getElementById("MigTypeDescriptionMessage").textContent = "Redeeming an IOU will give you back the NFT it represent on the destination chain.";
        break;

        case "":
          document.getElementById("MigTypeDescriptionMessage").textContent = "";
        break;

        default:
          document.getElementById("MigTypeDescriptionMessage").textContent = "Migration type unknown.";
      }
    }
    let showCard = function(id, disp){
      document.getElementById(id).style = (disp ? "display:flex;" : "display:none;")
    }
    let showCardLine = function(id, disp){
      showCard(id, disp);
      //If hide an element, reset its migData associated & input value
      if(id == "OriginWorldCardLine" && !disp){
        setOgWorldInputValue("");
      }else if(id == "OriginTokenIDCardLine" && !disp){
        setOgTokenIdInputValue("");
      }else if(id == "DestOwnerCardLine" && !disp){
        setDestOwnerInputValue("");
      }
    }
    let enableRedeemBtnIfNetworkMatch = function(){
      //If dest network is the one from metadata of IOU token, enable redeem button
      if(migData.destinationUniverseUniqueId == migData.metadataDestinationUniverseUniqueId){
        disableRedeemBtn(false);
      }else{
        //Disable btn + reset migrationTyp if it was set to Redeem
        unsetAndDisableRedeemBtn();
      }
    }
    let refreshCompleteBtnEnabled = function(){
      userAccount = window.web3.currentProvider.selectedAddress;
      document.getElementById("CompleteButton").disabled = !(model.isMigDataFilled()) || (migData.originOwner != userAccount);
    }

    //=====Input setters=====
    //These functions make sure the input value displayed is always the same as the variable in migData
    let unselectOriginUniv = function(){
      //Unselect drop down
      unselectDropDown("OriginNetworkSelector");
      //Reset migData associated data
      migData.originUniverseIndex = 0;
      migData.originUniverseUniqueId = "";
      migData.originNetworkId = "";//Blochain ID
      migData.originUniverse = "";
    }
    let setOgWorldInputValue = function(txt){
      let input = document.getElementById("inputOGContractAddress");
      //Set new text
      input.value = txt;
      //Save ogWorld into migaData object
      migData.originWorld = txt;
    }
    let setOgTokenIdInputValue = function(txt){
      let input = document.getElementById("inputOGTokenID");
      //Set new text
      input.value = txt;
      //Save ogWorld into migaData object
      migData.originTokenId = txt;
    }
    let setDestOwnerInputValue = function(txt){
      let input = document.getElementById("inputDestOwner");
      //Set new text
      input.value = txt;
      //Save ogWorld into migaData object, only if
      migData.destinationOwner = txt;
    }
    //Only modify the btn's appearance
    let disableRedeemBtn = function(disable){
      //Disable redeem button by default
      let redeemBtn = document.getElementById("RedeemButton");
      redeemBtn.disabled = disable;

      //Remove selected style when disabling btn
      if(disable){redeemBtn.classList.remove('Selected');}
    }
    //Modify the redeem btn apprearance + migData.migType
    let unsetAndDisableRedeemBtn = function(){
      //First, disable btn (appearance change only)
      disableRedeemBtn(true);

      //If migData.migType = Redeem, set to ""
      if(migData.migrationType == model.RedeemIOUMigrationType){migData.migrationType = "";}
    }
    let unselectMigrationButtons = function(){
      //Remove Selected class to buttons
      let selected = document.getElementById("MigrationTypeButtonsContainer").querySelector(".Selected");
      if(selected != undefined){selected.classList.remove('Selected');}
      migData.migrationType = "";

      //Hide text describing migType
      showMigrationTypeDescription(false, "");
    }
    //Select migBtn + associate the right value to migData.migrationType.
    let selectMigrationButton = function(migType){
      //First, unselect any previously selected btn
      unselectMigrationButtons();
      //Next find the correct button
      let btnToSelect = "";
      switch(migType){
        case model.MintOUIMigrationType:
          btnToSelect = document.getElementById("IOUMigrationButton");
          migData.migrationType = model.MintOUIMigrationType;
          model.isRedeem = false;
        break;

        case model.RedeemIOUMigrationType:
          btnToSelect = document.getElementById("RedeemButton");
          migData.migrationType = model.RedeemIOUMigrationType;
          model.isRedeem = true;
        break;
      }
      //Then select it
      if(btnToSelect){btnToSelect.classList.add('Selected');}

      //Finally show the text explaining the migration type
      showMigrationTypeDescription(true, migType);
    }

    //=====Data display=====
    //These functions make sure the value displayed is always the same as the variable in migData
    let setOriginOwner = function(owner){
      //Display new og owner
      document.getElementById("OGTokenOwner").textContent = owner.toLowerCase();
      //Add origin token owner to migData
      migData.originOwner = owner.toLowerCase();

      //If user is the owner, show "It's you!" next to og owner address.
      userAccount = window.web3.currentProvider.selectedAddress;
      if(userAccount == migData.originOwner){
        document.getElementById("OGTokenOwner").innerHTML = document.getElementById("OGTokenOwner").innerHTML + '&emsp;<span style="font-weight: normal;font-style: italic;">(It\'s you!)</span>';
      }
    }
    let setOriginTokenName = function(name, dispFetchingMsg){
      if(dispFetchingMsg){
        document.getElementById("OGTokenMetaName").textContent = "Fetching...";
        migData.originTokenName = "";
      }
      else{
        document.getElementById("OGTokenMetaName").textContent = name;
        migData.originTokenName = name;
      }
    }
    //Set the destTokenId to migData & display it in DestTokenIdCardLine
    let setDestinationTokenId = function(tokId){
      //Display new dest tok id
      document.getElementById("DestTokenId").textContent = tokId;
      //Add dest tok id to migData
      migData.destinationTokenId = tokId;
    }
    let setDestinationTokenIdWaitMsg = function(msg){
      //Display new dest tok id
      document.getElementById("DestTokenId").textContent = msg;
      //Add dest tok id to migData
      migData.destinationTokenId = "";
    }
    let setDestTokenName = function(show, txt){
      showCardLine("DestTokenNameCardLine", show);
      document.getElementById("DestTokenName").innerHTML = txt;
      migData.destinationTokenName = txt;
    }

    //=====Prefill functions=====
    //Prefill origin network with the one the user is connected to through his wallet
    let setOgNetDropDownToWalletNet = function(){
      let connectedChainId = parseInt(window.web3.currentProvider.chainId);
      //If user connected to a chain trough his wallet: prefill and show next form field
      if(connectedChainId != undefined){
        bridgeApp.networks.forEach((net, i) => {
          if(net.chainID == connectedChainId){
            selectDropDownOptionByIndex("OriginNetworkSelector", i);
            //Show next form field
          }
        });
      }
    }
    //Prefill all form fields. This function is called inside onChainSwitchedSuccess()
    let prefillFormWithMigData = function(){
      //OgNet is already prefilled because register_migration prompt user to switch to correct net for edit mig btn
      //Prefill ogWorld
      setOgWorldInputValue(migData.originWorld);
      //Prefill ogTokenId
      setOgTokenIdInputValue(migData.originTokenId);

      //load token meta data
      document.getElementById("FetchDataButton").click();
      //Prefill destNet
      selectDropDownOptionByIndex("DestinationNetworkSelector", migData.destinationUniverseTargerListIndex);

      //Select migration button
      if(migData.migrationType == model.MintOUIMigrationType){
        //Select the Mint IOU button
        selectMigrationButton(model.MintOUIMigrationType);

        //Prefill destWorld
        addDropDownOption("DestinationWorldSelector", migData.destinationWorld, "", "1");
        selectDropDownOptionByIndex("DestinationWorldSelector", 0);
      }
      else if(migData.migrationType == model.RedeemIOUMigrationType){
        //Enable redeem btn
        disableRedeemBtn(false);

        //Select Redeem btn
        selectMigrationButton(model.RedeemIOUMigrationType);

        //Prefill destWorld text element
        document.getElementById("DestWorldRedeem").textContent = migData.destinationWorld;
      }

      //Select relay
      selectDropDownOptionByIndex("RelaySelector", migData.migrationRelayIndex);

      //Prefill destTokenId
      setDestinationTokenId(migData.destinationTokenId);

      //Prefill dest token name
      setDestTokenName(true, migData.destinationTokenName);

      //Prefill destTokenOwner
      setDestOwnerInputValue(migData.destinationOwner);

      //Finally display all form fields
      showAllFormFields();
    }
    let resetTokenMetadata = function(){
      migData.metadataDestinationUniverseUniqueId = "";
      migData.metadataDestinationUniverseIndex = 0;
      migData.metadataDestinationUniverse = "";
      migData.metadataDestinationWorld = "";
      migData.metadataDestinationTokenId = "";
      migData.metadataDestinationBridgeAddr = "";
    }

    //Setup custom selector
    setupDropDown("OriginNetworkSelector", "Select the network where the token is currently.");
    setupDropDown("RelaySelector", "Select the relay you trust to operate the migration.");
    setupDropDown("DestinationNetworkSelector", "Select the network to which you want to migrate your token.");
    setupDropDown("DestinationWorldSelector", "Select the ERC-721 smart contract the destination token will belong to.");

    //Call Load data functions one after the other to execute form prefill when the last is finished
    //Load networks
    loadNets(function () {
        //Add select options
        for (var i = 0; i < bridgeApp.networks.length; i++) {
          addDropDownOption("OriginNetworkSelector", bridgeApp.networks[i].name, "", bridgeApp.networks[i].uniqueId);
        }

        //If provider is loaded, and networks from server, disp connected wallet
        if(model.isProviderLoaded() && areDataLoadedFromServer()){
          console.log("Networks loaded, dispWallet.");
          displayConnectedWallet();
        }
    });
    //Load relays
    loadRelays(function (){
      //Add select options
      for (var i = 0; i < bridgeApp.relays.length; i++) {
          addDropDownOption("RelaySelector", bridgeApp.relays[i].name, "", bridgeApp.relays[i].uniqueId);
      }

      //If provider is loaded, and networks from server, disp connected wallet
      if(model.isProviderLoaded() && areDataLoadedFromServer()){
        console.log("Relays loaded, dispWallet.");
        displayConnectedWallet();
      }
    });
    //Load ERC721 ABI
    loadERC721ABI(function (){});
    //Load ERC721 Metadata ABI
    loadERC721MetadataABI(function (){});
    //Load ERC165 ABI
    loadERC165ABI(function (){});

    //Listeners & Callback
    //When new origin network selected : Prompt user to connect to new chain selected
    addDropDownOnChangeCallback("OriginNetworkSelector", function(chainIndexSelected){
      let chainIDSelected = '0x' + bridgeApp.networks[chainIndexSelected].chainID.toString(16);

      //Prompt user to change his provider network to the one he selected
      promptSwitchChainDataToFetch(chainIDSelected);
    });
    addDropDownOnChangeCallback("RelaySelector", function(chainIndexSelected){
      //Add relay to migData
      migData.migrationRelayIndex = getDropDownSelectedOptionIndex("RelaySelector");
      migData.migrationRelay = bridgeApp.relays[Math.max(0, migData.migrationRelayIndex)].name;

      //if MINT IOU
      if(migData.migrationType == model.MintOUIMigrationType){
        //Display next form field: arrival title + arrival dest network
        showCardLine("ArrivalCard", true);
        showCardLine("DestWorldRedeemCardLine", false);//Hide destWorld text
        showCardLine("DestWorldCardLine", true);//Show destWorl selector

        //Show DestTokenName if original token name retrieved
        if(migData.originTokenName){
          setDestTokenName(true, 'IOU of ' + migData.originTokenName);
        }

        //Clear previous worlds retrieved from relay
        clearDropDownOptions("DestinationWorldSelector");

        //Load available destination world from relay
        getRelayAvailableWorlds();
      }
      //Else REDEEM: display all following form fields and prefill them with data from metadata
      else if(migData.migrationType == model.RedeemIOUMigrationType){
        //SHOW all next form field which are prefilled
        showArrivalFormFieldsOnRedeem(true);

        //Show fetching dest token name
        displayDestTokenNameMsg("Fetching...");

        //Retrieve dest token uri
        //Load dest token metadata + display token name
        getDestTokenURIAndDisplayTokenName();
      }

      //Prefill dest owner
      userAccount = window.web3.currentProvider.selectedAddress;
      //Prefill destTokenOwner with the current connected address
      setDestOwnerInputValue(userAccount);

      refreshCompleteBtnEnabled();
    });
    addDropDownOnChangeCallback("DestinationNetworkSelector", function(chainIndexSelected){
      //CLEAR PREVIOUS DATA
      //First, clear previous data.
      document.getElementById("DestContractName").innerHTML = "";
      document.getElementById("DestContractSymbol").innerHTML = "";

      //Reset migration buttons. Unselect the previously selected button.
      unselectMigrationButtons();
      //Clear drop downs
      //clearDropDownOptions("RelaySelector");
      //load available relay from network_list and relay_list

      //HIDE form fields further than one step from dest network drop down
      showFormFieldsAfterMigButtons(false);

      //Clear MigData from outdated data
      migData.destinationWorld = "";
      migData.migrationRelayIndex = 0;
      migData.migrationRelay = "";
      setDestinationTokenId("");

      //SAVE data to migData object
      //This index is relative to the list of destination networks which is different from the list of all networks.
      let destUnivDropDownIndex = getDropDownSelectedOptionIndex("DestinationNetworkSelector");
      let destUnivList = bridgeApp.networks[migData.originUniverseIndex].targetList;
      let destUnivId = destUnivList[destUnivDropDownIndex].networkId;
      //This index is the one relative to the full list of all networks. i.e. network_list.json
      let destUnivAbsoluteIndex = 0;
      let destUnivUniqueId = "";
      bridgeApp.networks.forEach((network, i) => {
        if(network.networkID == destUnivId){
          destUnivAbsoluteIndex = i;
          destUnivUniqueId = network.uniqueId;
        }
      });
      migData.destinationUniverseIndex = destUnivAbsoluteIndex;//Index in network_list "networks" array
      migData.destinationUniverseTargerListIndex = destUnivDropDownIndex;//Index in network_list "neworks.targetList" array
      migData.destinationUniverseUniqueId = destUnivUniqueId;
      migData.destinationUniverse = bridgeApp.networks[Math.max(0, migData.destinationUniverseIndex)].name;
      migData.destinationBridgeAddr = bridgeApp.networks[Math.max(0, migData.destinationUniverseIndex)].bridgeAdress;

      //Enable redeem if network dest if same as IOU metadata origin
      enableRedeemBtnIfNetworkMatch();
      //DISPLAY next form field: migration type buttons
      showCardLine("MigrationTypeCardLine", true);

      refreshCompleteBtnEnabled();
    });
    addDropDownOnChangeCallback("DestinationWorldSelector", function(chainIndexSelected){
      //If not redeem: display next form field and load data from relay
      if(migData.migrationType != model.RedeemIOUMigrationType){
        //Show next form field
        showCardLine("DestTokenIdCardLine", true);

        //Save destWorld addr into migData object
        let destWorldIndex = getDropDownSelectedOptionIndex("DestinationWorldSelector");
        migData.destinationWorld = bridgeApp.destWorlds[destWorldIndex];

        //Display next form field: dest owner input
        showCardLine("DestOwnerCardLine", true);//Owner is prefilled when relay is selected

        //Load desination tokenId from relay & display fetching text
        getAvailableTokenId();
      }
    });

    //===Origin world input===
    //When return/enter key pressed in input: Display ogTokenID input
    //Focus in & out, hint management
    document.getElementById("inputOGContractAddress").addEventListener('keyup', async(e) =>{
      //Show next form field
      showCardLine("OriginTokenIDCardLine", true);
      migData.originWorld = document.getElementById("inputOGContractAddress").value;
      //Refresh complete button at every character change in the input
      refreshCompleteBtnEnabled();

      if (e.key === 'Enter' || e.keyCode === 13) {
        //document.getElementById("inputOGContractAddress").dispatchEvent(new Event("focusout"));
        document.getElementById("inputOGTokenID").focus();
        //Call change -> fetch token data
        document.getElementById("inputOGContractAddress").dispatchEvent(new Event("change"));
      }
    });
    document.getElementById("inputOGContractAddress").addEventListener('change', async(e) =>{
      //If originWorld is filled: display ERC721 compliant msg depending on isOgContractERC721
      isOgContractERC721().then(function(isERC721){
        //Show ERC721 compliant MSG & adapt text
        showIsERC721CompliantMsg(migData.originWorld != "", isERC721);

        //Trigger Fetch data button, if tokenId is filled
        if(migData.originTokenId && document.getElementById("inputOGTokenID").value){
          document.getElementById("FetchDataButton").click();
        }
      });
    });

    //===Origin tokenID input===
    //When return/enter key pressed in input: Display dest owner input
    /*document.getElementById("inputOGTokenID").addEventListener('keyup', async(e) =>{
      //Unfocus input when enter key is pressed
      if (e.key === 'Enter' || e.keyCode === 13) {
        document.getElementById("inputOGTokenID").dispatchEvent(new Event("change"));
      }
    });*/
    document.getElementById("inputOGTokenID").addEventListener('keyup', async() =>{
      let inputVal = document.getElementById("inputOGTokenID").value;
      if(inputVal.startsWith('0x')){
        setOgTokenIdInputValue(parseInt(inputVal, 16).toString());
      }else{
        setOgTokenIdInputValue(inputVal);
      }
      //refresh complete btn enabled
      refreshCompleteBtnEnabled();
    });
    document.getElementById("inputOGTokenID").addEventListener('change', async() =>{
      //Clear previous token datas
      clearTokenData();

      //Trigger Fetch data button
      document.getElementById("FetchDataButton").click();
    });

    //===Destination owner input===
    //When input is unfocused, display originTokenID input
    document.getElementById("inputDestOwner").addEventListener('keyup', async() =>{
      document.getElementById("inputDestOwner").dispatchEvent(new Event("change"));
    });
    document.getElementById("inputDestOwner").addEventListener('change', async() =>{
      migData.destinationOwner = document.getElementById("inputDestOwner").value;
      refreshCompleteBtnEnabled();
    });

    //Disconnect wallet button
    document.getElementById("DisconnectWalletBtn").addEventListener('click', async() =>{
      //Clear originUniv.
      unselectOriginUniv();
      //Clear tokens data
      clearTokenData();
      model.disconnectWallet = true;
      model.navigateTo('wallet_connection');
    });

    //Migration type buttons
    document.getElementById("FullMigrationButton").addEventListener('click', async() =>{/*NOTHING*/});
    document.getElementById("IOUMigrationButton").addEventListener('click', function() {
      //If button already selected, do nothing
      if(migData.migrationType == model.MintOUIMigrationType){return;}

      //Select the new btn
      selectMigrationButton(model.MintOUIMigrationType);

      //Clear destWorld previous data
      clearDropDownOptions("DestinationWorldSelector");
      //Reset previous migData destination var
      setDestinationTokenId("");
      //Unselect relay dropdown
      unselectDropDown("RelaySelector");

      //Display next form field: relay drop down
      showCardLine("MigrationRelayCardLine", true);

      //Hide all fields after relay drop down
      showFormFieldsAfterRelay(false);

      refreshCompleteBtnEnabled();
    });
    document.getElementById("RedeemButton").addEventListener('click', function() {
      //If button already selected, do nothing
      if(migData.migrationType == model.RedeemIOUMigrationType){return;}

      //Select the new btn
      selectMigrationButton(model.RedeemIOUMigrationType);

      //Clear destWorld previous data
      clearDropDownOptions("DestinationWorldSelector");
      //Reset previous migData destination var
      setDestinationTokenId("");

      //Fill migData object with migration data from metadata: destNet, world, tokenId
      migData.destinationUniverseUniqueId = migData.metadataDestinationUniverseUniqueId;
      migData.destinationUniverseIndex = migData.metadataDestinationUniverseIndex;
      migData.destinationUniverse = migData.metadataDestinationUniverse;
      migData.destinationWorld = migData.metadataDestinationWorld;
      setDestinationTokenId(migData.metadataDestinationTokenId);//Set migData destTokenId & display it
      migData.destinationBridgeAddr = migData.metadataDestinationBridgeAddr;

      //PREFILL fields
      //Prefill destWorld text because redeem selected
      document.getElementById("DestWorldRedeem").textContent = migData.destinationWorld;

      //Show relay selector
      showCardLine("MigrationRelayCardLine", true);

      //If relay already selected, display all form till the end !
      if(getDropDownSelectedOptionIndex("RelaySelector") >= 0){
        //Call relaydropdown callback, as if user selected the relay in drop down
        triggerDropDownOnChange("RelaySelector");
      }

      refreshCompleteBtnEnabled();
    });

    //Setting token data retrieval
    document.getElementById("FetchDataButton").addEventListener('click', async() =>{
      //Refresh connected addr for the rest of the migration form
      userAccount = window.web3.currentProvider.selectedAddress;

      //Fetch token data only if og world + token id filled
      if(migData.originWorld && migData.originTokenId){
        //If og contract is ERC721, load token data
        isOgContractERC721().then(function(isERC721){
          if(isERC721){
            //Show msg saying that this contract is ERC-721
            showIsERC721CompliantMsg(true, true);

            //If user not coming from register_mig & Edit migration
            if(!model.editMigrationForm){
              //Clear previous tokens data
              clearTokenData();
            }else{
              //Do not clear TokData only once. Next time, clear them
              model.editMigrationForm = false;
            }

            //Load metadata from chain: token URI, symbole, name
            loadOgTokenData();
          }
          else{
            //Show msg telling the contract is not ERC-721 compliant
            showIsERC721CompliantMsg(true,false);
          }
        });
      }
    });
    //Setup rooting
    document.getElementById("CompleteButton").addEventListener('click', async() =>{
      //Clear last data from previous migration if exists
      //This data is still here to let user come back to migration_finished
      //from migration_form and see his tokenURI & txHash
      //But need to be deleted, because if not /pollingMigrationHash request will not be sent
      model.destinationTokenTransfertTxHash = "";

      console.log('===Migration Data===');
      console.log(migData);
      model.navigateTo("/register_migration");
    });

    //HANDLE WALLET CONNECTION
    //If web3 already injected
    if(!window.web3){
        model.navigateTo("/migration_finished");
    }
    else if(model.isProviderLoaded()){
      console.log("Westron already loaded, perfect.");
      //Display connected addr + ogNet & prefill it
      displayConnectedWallet();
    }
    //If metamask available: autoconnect without redirecting to connection page.
    else if (window.web3.__isMetaMaskShim__ && window.web3.currentProvider.selectedAddress != null) {
      console.log("Metamask detected. Auto connect.");
      loadWestron();

      //Once loadWestron started, wait for it to finish by polling.
      let cmptr = 0;
      let pollWestronLoaded = async function(){
        try{
          await connectToMetamask();
          console.log("Westron lib loaded after " + cmptr + " attempts.");
        }catch(err){
          cmptr++;
          if(cmptr > 100){
            console.log("Westron loading timed out.");
          }else {
            setTimeout(pollWestronLoaded, 50);
          }
        }
      }
      //Start polling for westron
      pollWestronLoaded();


    }
    //Redirect to wallet_connection page
    else{
      document.getElementById("ConnectedAccountAddr").textContent = "Wallet not connected. Redirect to connection page.";
      console.log("Westron lib not loaded. Redirecting to wallet_connection");
      model.navigateTo('wallet_connection');
      return;//To stop javascript execution in initCode() function
    }

    //When user come back on tab: verify ogNet & wallet net
    window.onfocus = function(){
      //If migration form displayed
      if(document.getElementById("MigrationFormDisplay")){
        //If tokens data are loaded, do not prompt switch network.
        let originChainSelectedIndex = getDropDownSelectedOptionIndex("OriginNetworkSelector");
        if(originChainSelectedIndex >= 0 && migData.originWorld){
          //Timeout to let time to provider to switch network & refresh window.web3.currentProvider.chainId.
          //If not, it will call promptSwitchChainFetchedData again once the user come back from provider prompt to the website (window onfocus triggered)
          setTimeout(function(){
            //Retrieve chain id selected in ogNet dropdown
            let chainIDSelected = '0x' + bridgeApp.networks[originChainSelectedIndex].chainID.toString(16);
            //Retrieve provider network
            let providerNetwork = window.web3.currentProvider.chainId;
            //Only prompt if ogNet is set & origin owner is not retrieved & ogNet different from wallet net
            if(!migData.originOwner &&  chainIDSelected != providerNetwork){
              //Display user message jutifying why to switch network
              displayOgNetworkSwitchMsg("Please change your provider network to the one you selected above.");

              //Change ogNetwork migData & fetch data if possible
              promptSwitchChainFetchedData(chainIDSelected);
            }
          }, 700);
        }
        //If user hasn't filled any fields, just change ogNet dropdown to the provider net
        else if(originChainSelectedIndex >= 0 && !migData.originWorld && !migData.originTokenId){
          let currentProviderNetId = window.web3.currentProvider.chainId;
          changeOriginNetworkAndFetchTokenData(currentProviderNetId);
        }
      }
    }
  }


  async getHtml(callback){
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let htmlContent = xhr.response;
        callback(htmlContent);
      }
    };
    xhr.open('GET', '/site/static_views/MigrationForm.html');
    xhr.send();
  }
}
