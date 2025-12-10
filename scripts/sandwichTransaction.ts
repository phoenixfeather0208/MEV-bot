import { BigNumber, Transaction, ethers } from "ethers";
import {
  FlashbotsBundleProvider,
  FlashbotsBundleResolution,
} from "@flashbots/ethers-provider-bundle";
import DecodedTransactionProps from "../types/DecodedTransactionProps";
import { uniswapV2Router, getAmounts, getPair } from "./utils";
import {
  chainId,
  httpProviderUrl,
  privateKey,
  wETHAddress,
  buyAmount,
  uniswapV2RouterAddress,
} from "../constants";
import AmountsProps from "../types/AmountsProps";
import Erc20Abi from "../abi/ERC20.json";

const provider = ethers.getDefaultProvider(httpProviderUrl);
const signer = new ethers.Wallet(privateKey!, provider);
const deadline = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

const sandwichTransaction = async (
  decoded: DecodedTransactionProps | undefined
): Promise<boolean> => {
  if (!decoded) return false;
  const pairs = await getPair(decoded.targetToken);
  console.log(pairs);
  console.log("?!!!!!!!!!", decoded.transaction.hash);
  if (!pairs) return false;
  const amounts = getAmounts(decoded, pairs);
  if (!amounts) return false;

  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    signer
  );

  // 1. Swap ETH for tokens
  const t1 = await firstTransaction(decoded, amounts);

  console.log("t1", t1);

  // 2. Wrap target transacton
  const t2 = secondTransaction(decoded.transaction);

  console.log("!!!!!!!!!!!!!!!!!!!!!!");
  // Sign sandwich transaction
  const bundle = await signBundle([t1, t2], flashbotsProvider);

  // Finally try to get sandwich transaction included in block
  const result = await sendBundle(bundle, flashbotsProvider, decoded.path[1]);

  if (result) console.log("bundle: ", bundle);

  return result ?? false;
};

const approve = async (tokenContractAddress: string) => {
  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    Erc20Abi,
    signer
  );

  try {
    const balance = await tokenContract.balanceOf(signer.address);
    // Call the `approve` function
    const tx = await tokenContract.approve(uniswapV2RouterAddress, balance);
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`Transaction successful: ${tx.hash}`);
    return balance;
  } catch (error) {
    console.error("Error approving tokens:", error);
  }
};

const firstTransaction = async (
  decoded: DecodedTransactionProps,
  amounts: AmountsProps
) => {
  console.log(amounts);
  const transaction = await uniswapV2Router
    .connect(signer)
    .swapExactETHForTokens(
      BigNumber.from(0),
      [wETHAddress, decoded.targetToken],
      signer.address,
      deadline,
      {
        value: buyAmount,
        type: 2,
        maxFeePerGas: amounts.maxGasFee,
        maxPriorityFeePerGas: amounts.priorityFee,
        gasLimit: 300000,
      }
    );

  let firstTransaction = {
    signer: signer,
    transaction: transaction,
  };

  firstTransaction.transaction = {
    ...firstTransaction.transaction,
    chainId,
  };
  console.log("first");
  return firstTransaction;
};

const secondTransaction = (transaction: Transaction) => {
  const victimsTransactionWithChainId = {
    //@ts-expect-error
    chainId,
    ...transaction,
  };
  if (victimsTransactionWithChainId.type === 2) {
    delete victimsTransactionWithChainId.gasPrice;
  }
  let signedMiddleTransaction;

  try {
    signedMiddleTransaction = {
      signedTransaction: ethers.utils.serializeTransaction(
        victimsTransactionWithChainId,
        {
          r: victimsTransactionWithChainId.r!,
          s: victimsTransactionWithChainId.s,
          v: victimsTransactionWithChainId.v,
        }
      ),
    };
  } catch (error: any) {
    console.log("Error signedMiddleTransaction: ", error);
    return;
  }
  console.log("second");

  return signedMiddleTransaction;
};

const signBundle = async (
  transactions: any,
  flashbotsProvider: FlashbotsBundleProvider
) => {
  const transactionsArray = [...transactions];
  const signedBundle = await flashbotsProvider.signBundle(transactionsArray);
  console.log(signedBundle);
  return signedBundle;
};

const sendBundle = async (
  bundle: any,
  flashbotsProvider: FlashbotsBundleProvider,
  tokenContractAddress: string
) => {
  const blockNumber = await provider.getBlockNumber();
  console.log("Simulating...");
  const simulation = await flashbotsProvider.simulate(bundle, blockNumber + 1);
  //@ts-expect-error
  if (simulation.firstRevert) {
    //@ts-expect-error
    console.log("Simulation error", simulation.firstRevert);
    return false;
  }
  console.log("Simulation success");

  // 12. Send transactions with flashbots
  let bundleSubmission: { bundleHash: any; wait: () => any };
  flashbotsProvider
    .sendRawBundle(bundle, blockNumber + 1)
    .then((_bundleSubmission: any) => {
      bundleSubmission = _bundleSubmission;
      console.log("Bundle submitted", bundleSubmission.bundleHash);
      return bundleSubmission.wait();
    })
    .then(async (waitResponse: any) => {
      console.log("Wait response", FlashbotsBundleResolution[waitResponse]);
      if (
        waitResponse == FlashbotsBundleResolution.BundleIncluded ||
        waitResponse == FlashbotsBundleResolution.BlockPassedWithoutInclusion
      ) {
        if (waitResponse == FlashbotsBundleResolution.BundleIncluded)
          console.log("Bundle Included!");
        try {
          approve(tokenContractAddress).then((balance: number) => {
            console.log("Token Approved!");
            uniswapV2Router
              .swapExactTokensForETH(
                balance,
                0,
                [tokenContractAddress, wETHAddress],
                signer.address,
                deadline
              )
              .then(() => {
                console.log("Tokens are sold!");
                return true;
              });
          });
        } catch (e) {
          console.log(e);
        }
      } else if (
        waitResponse == FlashbotsBundleResolution.AccountNonceTooHigh
      ) {
        console.log("The transaction has been confirmed already");
      }
      return false;
    });
};

export default sandwichTransaction;
