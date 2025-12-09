import { ethers } from "ethers";
import { httpProviderUrl, wssProviderUrl } from "./constants";
import decodeTransaction from "./scripts/decodeTransaction";
import sandwichTransaction from "./scripts/sandwichTransaction";
import fs from "fs";
import WebSocket from "ws";

const provider = new ethers.providers.JsonRpcProvider(httpProviderUrl);
const wssProvider = new ethers.providers.WebSocketProvider(wssProviderUrl!);
const socket = new WebSocket(wssProviderUrl!);
const isAlchemyApi = process.env.ALCHEMY_API ? true : false;

console.log("Listen for swaps on UniswapV2 to sandwich...");

// Get transaction, decode it and sandwich
const handleTransaction = async (txHash: string) => {
  try {
    const targetTransaction = await provider.getTransaction(txHash);
    const decoded = await decodeTransaction(targetTransaction);
    const sandwich = await sandwichTransaction(decoded);
    // console.log(sandwich);
    if (sandwich) {
      console.log("Sandwich successful!");
      fs.appendFile("sandwich.json", JSON.stringify(decoded) + "\n", (err) => {
        if (err) throw err;
        console.log("Data updated successfully");
      });
    }
  } catch (error) {
    console.log(error);
  }
};

if (!isAlchemyApi) {
  // Listen to transaction hashes in the mempool
  wssProvider.on("pending", (txHash) => handleTransaction(txHash));

  wssProvider.on("close", () => {
    console.log("WebSocket connection closed. Attempting to reconnect...");
    // Try reconnecting after a short delay
    setTimeout(() => {
      console.log("Reconnected to WebSocket");
    }, 5000); // Reconnect after 5 seconds
  });
} else {
  socket.addEventListener("open", function (event) {
    console.log("Connected to the WebSocket server");

    // Specify the subscription
    const subscriptionMessage = {
      jsonrpc: "2.0",
      method: "eth_subscribe",
      params: [
        "alchemy_pendingTransactions",
        {
          fromAddress: "0x8b21F52c1ECc59A30e635E77F7d436085061cC15",
          hashesOnly: true,
        },
      ],
      id: 1,
    };

    // Send the subscription message
    socket.send(JSON.stringify(subscriptionMessage));
  });

  // Listen for messages from the server
  socket.addEventListener("message", function (event: any) {
    const data = JSON.parse(event.data);
    const txHash = data?.params?.result;
    console.log(txHash);
    if (txHash) {
      handleTransaction(txHash);
    } else return;
  });

  // Listen for errors
  socket.addEventListener("error", function (event) {
    console.error("WebSocket error: ", event);
  });

  // Listen for connection close
  socket.addEventListener("close", function (event) {
    console.log("WebSocket connection closed: ", event);
  });
}
