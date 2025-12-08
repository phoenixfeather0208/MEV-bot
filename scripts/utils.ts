import { BigNumber, ethers } from "ethers";
import uniswapPairByteCode from "../bytecode/uniswapPairByteCode";
import erc20ByteCode from "../bytecode/erc20ByteCode";
import UniswapV2PairAbi from "../abi/UniswapV2Pair.json";
import UniswapV2RouterAbi from "../abi/UniswapV2Router.json";
import UniswapV2FactoryAbi from "../abi/UniswapV2Factory.json";
import Erc20Abi from "../abi/ERC20.json";
import {
  gasBribe,
  buyAmount,
  httpProviderUrl,
  privateKey,
  uniswapV2RouterAddress,
  wETHAddress,
  uniswapV2FactoryAddress,
  isMainnet,
} from "../constants";
import DecodedTransactionProps from "../types/DecodedTransactionProps";
import PairProps from "../types/PairProps";
import AmountsProps from "../types/AmountsProps";

const provider = ethers.getDefaultProvider(httpProviderUrl);
const signer = new ethers.Wallet(privateKey!, provider);

const uniswapV2Router = new ethers.Contract(
  uniswapV2RouterAddress,
  UniswapV2RouterAbi
);

const UniswapV2Factory = new ethers.Contract(
  uniswapV2FactoryAddress,
  UniswapV2FactoryAbi,
  signer
);

const erc20Factory = new ethers.ContractFactory(
  Erc20Abi,
  erc20ByteCode,
  signer
);

const getPair = async (token: string) => {
  const pairAddress = await UniswapV2Factory.getPair(wETHAddress, token);
  console.log(pairAddress);
  const pairFactory = new ethers.Contract(
    pairAddress,
    UniswapV2PairAbi,
    signer
  );

  try {
    const reserves = await pairFactory.getReserves();
    console.log(reserves);
    return { token0: reserves._reserve0, token1: reserves._reserve1 };
  } catch (e) {
    return;
  }
};

const decodeSwap = async (input: string) => {
  const abiCoder = new ethers.utils.AbiCoder();
  const decodedParameters = abiCoder.decode(
    ["address", "uint256", "uint256", "bytes", "bool"],
    input
  );

  let path: string[] = [];
  let hasTwoPath = true;

  if (!isMainnet) {
    let addresses = decodedParameters[3].split("0x")[1];
    const pathOne = "0x" + addresses.slice(0, 40);
    const pathTwo = "0x" + addresses.slice(-40);
    path = [pathOne, pathTwo];
  } else {
    const pathOne = "0x" + input.slice(-104, -64);
    const pathTwo = "0x" + input.slice(-40);
    path = [pathOne, pathTwo];
  }

  return {
    //@ts-expect-error
    recipient: parseInt(decodedParameters[(0, 16)]),
    amountIn: decodedParameters[1],
    minAmountOut: decodedParameters[2],
    path,
    hasTwoPath,
  };
};

const getAmountOut = (
  amountIn: BigNumber,
  reserveIn: BigNumber,
  reserveOut: BigNumber
) => {
  const amountInWithFee = amountIn.mul(997); // Uniswap fee of 0.3%
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = reserveIn.mul(1000).add(amountInWithFee);
  const amountOut = numerator.div(denominator);
  return amountOut;
};

const getAmounts = (
  decoded: DecodedTransactionProps,
  pairs: PairProps
): AmountsProps | undefined => {
  const { transaction, amountIn, minAmountOut } = decoded;
  const { token0, token1 } = pairs;

  const maxGasFee = transaction.maxFeePerGas
    ? transaction.maxFeePerGas.add(gasBribe ?? 0)
    : BigNumber.from(gasBribe);

  const priorityFee = transaction.maxPriorityFeePerGas
    ? transaction.maxPriorityFeePerGas.add(gasBribe ?? 0)
    : BigNumber.from(gasBribe);

  let firstAmountOut = getAmountOut(BigNumber.from(buyAmount), token0, token1);
  const updatedReserveA = token0.add(buyAmount!);
  const updatedReserveB = token1.add(firstAmountOut.mul(997).div(1000));

  let secondBuyAmount = getAmountOut(
    amountIn,
    updatedReserveA,
    updatedReserveB
  );

  if (secondBuyAmount.lt(minAmountOut)) return;
  const updatedReserveA2 = updatedReserveA.add(amountIn);
  const updatedReserveB2 = updatedReserveB.add(
    secondBuyAmount.mul(997).div(1000)
  );

  let thirdAmountOut = getAmountOut(
    firstAmountOut,
    updatedReserveB2,
    updatedReserveA2
  );

  return {
    maxGasFee,
    priorityFee,
    firstAmountOut,
    secondBuyAmount,
    thirdAmountOut,
  };
};

export { getPair, decodeSwap, getAmounts, uniswapV2Router, erc20Factory };
