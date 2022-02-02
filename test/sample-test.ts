import { expect } from "chai";
import { Contract, ContractFactory, Signer, utils } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { hexConcat } from "@ethersproject/bytes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

let Bridge1 : ContractFactory;
let bridge1 : Contract;
let Bridge2 : ContractFactory;
let bridge2 : Contract;
let NFT : ContractFactory;
let nft : Contract;
let BSC : ContractFactory;
let bsc : Contract;
let owner: SignerWithAddress;
let addr1: SignerWithAddress;
let addr2: SignerWithAddress;
let addr3: SignerWithAddress;

describe("Hermes", function () {

  beforeEach(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.connect(owner).deploy();
    BSC = await ethers.getContractFactory("NFT");
    bsc = await BSC.connect(owner).deploy();
    Bridge1 = await ethers.getContractFactory("Bridge");
    bridge1 = await Bridge1.connect(owner).deploy(nft.address, 1);
    Bridge2 = await ethers.getContractFactory("Bridge");
    bridge2 = await Bridge2.connect(owner).deploy(bsc.address, 2);
  });

  describe("Bridges", () => {
    it("Bridges", async () => {
      await nft.deployed();
      await bsc.deployed();
      await bridge1.deployed();
      await bridge2.deployed();
      const BridgeRole1 = await nft.connect(owner).setBridgeRole(bridge1.address);
      const BridgeRole2 = await bsc.connect(owner).setBridgeRole(bridge2.address);
      await BridgeRole1.wait();
      await BridgeRole2.wait();
      const ChairePerson1 = await bridge1.connect(owner).setChairePersonRole(addr3.address);
      const ChairePerson2 = await bridge2.connect(owner).setChairePersonRole(addr3.address);
      await ChairePerson1.wait();
      await ChairePerson2.wait();
      const MinterRole1 = await nft.connect(owner).setMinterRole(addr1.address);
      const MinterRole2 = await bsc.connect(owner).setMinterRole(addr1.address);
      await MinterRole1.wait();
      await MinterRole2.wait();
      const Mint1 = await nft.connect(addr1).mint(addr1.address, 1234);
      await Mint1.wait();
      const SwapNFT = await bridge1.connect(addr1).swap(1234, 2, 1);
      await SwapNFT.wait();
      const signedDataHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256", "uint256"],
        [1234, addr1.address, 1, 1, 2]
      );
      const bytesArray = ethers.utils.arrayify(signedDataHash);
      const flatSignature1 = await addr3.signMessage(bytesArray);
      const signature1 = ethers.utils.splitSignature(flatSignature1);
      const RedeemBSC = await bridge2.connect(addr3).redeem(1234, addr1.address, 1, 1, signature1.v, signature1.r, signature1.s);
      await RedeemBSC.wait();
    });
  });

  describe("Check errors", () => {
    it("User has no rights to this token", async () => {
      await nft.deployed();
      await bsc.deployed();
      await bridge1.deployed();
      await bridge2.deployed();
      const BridgeRole1 = await nft.connect(owner).setBridgeRole(bridge1.address);
      const BridgeRole2 = await bsc.connect(owner).setBridgeRole(bridge2.address);
      await BridgeRole1.wait();
      await BridgeRole2.wait();
      const ChairePerson1 = await bridge1.connect(owner).setChairePersonRole(addr3.address);
      const ChairePerson2 = await bridge2.connect(owner).setChairePersonRole(addr3.address);
      await ChairePerson1.wait();
      await ChairePerson2.wait();
      const MinterRole1 = await nft.connect(owner).setMinterRole(addr1.address);
      const MinterRole2 = await bsc.connect(owner).setMinterRole(addr1.address);
      await MinterRole1.wait();
      await MinterRole2.wait();
      const Mint1 = await nft.connect(addr1).mint(addr1.address, 1234);
      await Mint1.wait();
      await expect(bridge1.connect(addr2).swap(1234, 2, 1)).to.be.revertedWith("User has no rights to this token");
    });

    it("Signature is wrong", async () => {
      await nft.deployed();
      await bsc.deployed();
      await bridge1.deployed();
      await bridge2.deployed();
      const BridgeRole1 = await nft.connect(owner).setBridgeRole(bridge1.address);
      const BridgeRole2 = await bsc.connect(owner).setBridgeRole(bridge2.address);
      await BridgeRole1.wait();
      await BridgeRole2.wait();
      const ChairePerson1 = await bridge1.connect(owner).setChairePersonRole(addr3.address);
      const ChairePerson2 = await bridge2.connect(owner).setChairePersonRole(addr3.address);
      await ChairePerson1.wait();
      await ChairePerson2.wait();
      const MinterRole1 = await nft.connect(owner).setMinterRole(addr1.address);
      const MinterRole2 = await bsc.connect(owner).setMinterRole(addr1.address);
      await MinterRole1.wait();
      await MinterRole2.wait();
      const Mint1 = await nft.connect(addr1).mint(addr1.address, 1234);
      await Mint1.wait();
      const SwapNFT = await bridge1.connect(addr1).swap(1234, 2, 1);
      await SwapNFT.wait();
      const signedDataHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256"],
        [1234, addr1.address, 1, 1]
      );
      const bytesArray = ethers.utils.arrayify(signedDataHash);
      const flatSignature1 = await addr3.signMessage(bytesArray);
      const signature1 = ethers.utils.splitSignature(flatSignature1);
      await expect(bridge2.connect(addr3).redeem(1234, addr1.address, 1, 1, signature1.v, signature1.r, signature1.s)).to.be.revertedWith("Signature is wrong");
    });

    it("Already Redeemed", async () => {
      await nft.deployed();
      await bsc.deployed();
      await bridge1.deployed();
      await bridge2.deployed();
      const BridgeRole1 = await nft.connect(owner).setBridgeRole(bridge1.address);
      const BridgeRole2 = await bsc.connect(owner).setBridgeRole(bridge2.address);
      await BridgeRole1.wait();
      await BridgeRole2.wait();
      const ChairePerson1 = await bridge1.connect(owner).setChairePersonRole(addr3.address);
      const ChairePerson2 = await bridge2.connect(owner).setChairePersonRole(addr3.address);
      await ChairePerson1.wait();
      await ChairePerson2.wait();
      const MinterRole1 = await nft.connect(owner).setMinterRole(addr1.address);
      const MinterRole2 = await bsc.connect(owner).setMinterRole(addr1.address);
      await MinterRole1.wait();
      await MinterRole2.wait();
      const Mint1 = await nft.connect(addr1).mint(addr1.address, 1234);
      await Mint1.wait();
      const SwapNFT = await bridge1.connect(addr1).swap(1234, 2, 1);
      await SwapNFT.wait();
      const signedDataHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256", "uint256"],
        [1234, addr1.address, 1, 1, 2]
      );
      const bytesArray = ethers.utils.arrayify(signedDataHash);
      const flatSignature1 = await addr3.signMessage(bytesArray);
      const signature1 = ethers.utils.splitSignature(flatSignature1);
      const RedeemBSC = await bridge2.connect(addr3).redeem(1234, addr1.address, 1, 1, signature1.v, signature1.r, signature1.s);
      await RedeemBSC.wait();
      await expect(bridge2.connect(addr3).redeem(1234, addr1.address, 1, 1, signature1.v, signature1.r, signature1.s)).to.be.revertedWith("Already Redeemed");
    });
  });

});
