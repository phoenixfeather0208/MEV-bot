require("dotenv").config();

const isMainnet = process.env.IS_MAINNET;

const chainId = isMainnet ? 1 : 11155111;

const privateKey = isMainnet
  ? process.env.MAINNET_WALLET_PRIVATE_KEY
  : process.env.TESTNET_WALLET_PRIVATE_KEY;

const httpProviderUrl = isMainnet
  ? process.env.MAINNET_NODE_URL
  : process.env.TESTNET_NODE_URL;

const wssProviderUrl = isMainnet
  ? process.env.MAINNET_NODE_URL_WSS
  : process.env.TESTNET_NODE_URL_WSS;

const uniswapUniversalRouterAddress = isMainnet
  ? "0x66a9893cc07d91d95644aedd05d03f95e1dba8af"
  : "0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b";

const uniswapV2RouterAddress = isMainnet
  ? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  : "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

const wETHAddress = isMainnet
  ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  : "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

const uniswapV2FactoryAddress = isMainnet
  ? "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
  : "0xF62c03E08ada871A0bEb309762E260a7a6a880E6";

const gasBribe = process.env.GAS_BRIBE_IN_GWEI;
const buyAmount = process.env.BUY_AMOUNT_IN_WEI;

const tokenList = ["0x1c7d4b196cb0c7b01d743fbc6116a902379c7238"];

export {
  isMainnet,
  chainId,
  privateKey,
  wssProviderUrl,
  httpProviderUrl,
  uniswapUniversalRouterAddress,
  wETHAddress,
  uniswapV2FactoryAddress,
  uniswapV2RouterAddress,
  gasBribe,
  buyAmount,
  tokenList,
};
