import { BigNumber, Transaction, ethers } from "ethers";
import UniswapUniversalRouterV2Abi from "../abi/UniswapUniversalRouterV3.json";
import {
  isMainnet,
  tokenList,
  uniswapUniversalRouterAddress,
  wETHAddress,
} from "../constants";
import { decodeSwap } from "./utils";
import DecodedTransactionProps from "../types/DecodedTransactionProps";

// const uniswapV3Interface = new ethers.utils.Interface(
//   UniswapUniversalRouterV3Abi
// );

const uniswapV2Interface = new ethers.utils.Interface(
  UniswapUniversalRouterV2Abi
);

const decodeTransaction = async (
  transaction: Transaction
): Promise<DecodedTransactionProps | undefined> => {
  if (!transaction || !transaction.to) return;
  if (Number(transaction.value) == 0) return;
  if (
    transaction.to.toLowerCase() != uniswapUniversalRouterAddress.toLowerCase()
  ) {
    return;
  }

  let decoded;

  try {
    decoded = uniswapV2Interface.parseTransaction(transaction);
  } catch (e) {
    console.log(e);
    return;
  }
  // Make sure it's a UniswapV2 swap
  if (!isMainnet && !decoded.args.commands.includes("0x0b000604")) return;

  if (isMainnet && !decoded.args.commands.includes("0x0b080604")) return;

  // console.log("HERE");
  // let swapPositionInCommands =
  //   decoded.args.commands.substring(2).indexOf("08") / 2;

  let inputPosition = decoded.args.inputs[1];
  decoded = await decodeSwap(inputPosition);
  if (!decoded) return;
  if (!decoded.hasTwoPath) return;
  // console.log(decoded);
  // if (decoded.recipient === 2) return;
  if (decoded.path[0].toLowerCase() != wETHAddress.toLowerCase()) return;
  // console.log(decoded.path[1]);
  if (!tokenList.includes(decoded.path[1])) return;

  console.log(decoded);

  return {
    transaction,
    // amountIn: transaction.value,
    amountIn: decoded.amountIn,
    minAmountOut: decoded.minAmountOut,
    path: decoded.path,
    targetToken: decoded.path[1],
  };
};

export default decodeTransaction;
