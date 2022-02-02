import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
import { task } from "hardhat/config";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { hexConcat } from "@ethersproject/bytes";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "./tasks";

const { MNEMONIC, INFURA_URL, TOKEN_ADDR, DAO_ADDR } = process.env;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    compilers: [{
      version: "0.8.2",
    },
    {
      version: "0.5.16",
    },
    {
      version: "0.5.0",
    },
    ],
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  networks: {
    rinkeby: {
      // gas: 5000000,
      // gasPrice: 20000000000,
      url: INFURA_URL,
      accounts: { 
        mnemonic: MNEMONIC
      },
    }
  }
};
