"use client"

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  decodeEventLog,
  encodeEventTopics,
  getAddress  
} from "viem"
import { polygonAmoy } from "viem/chains" 
import abiData from "./escrowAbi.json"

const abi = abiData.abi || abiData 

export const contractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS

export const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http("https://rpc-amoy.polygon.technology"),
})

export const getWalletClient = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return createWalletClient({
        chain: polygonAmoy,
        transport: custom(window.ethereum),
      })
    } catch (error) {
      throw new Error("User menolak koneksi wallet")
    }
  }
  throw new Error("Metamask tidak terdeteksi")
}

export const checkout = async (items) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  
  const sellers = items.map(item => getAddress(item.sellerAddress))
  const skus = items.map(item => item.sku)
   
  const amounts = items.map(item => 
    parseEther((Number(item.priceInPol) * Number(item.amountKg || 1)).toFixed(18))
  )
  
  const totalValue = amounts.reduce((acc, curr) => acc + curr, 0n)
 
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "checkout",
    args: [sellers, amounts, skus],
    account,
    value: totalValue,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
 
  const blockchainIds = []
  const eventTopics = encodeEventTopics({ abi, eventName: 'TransactionCreated' })

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === contractAddress.toLowerCase() && log.topics[0] === eventTopics[0]) {
      try {
        const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics })
        blockchainIds.push({
          txId: decoded.args.txId.toString(),
          seller: decoded.args.seller,
          amount: decoded.args.amount.toString()
        })
      } catch (e) {
        console.error("Failed to decode log:", e)
      }
    }
  }

  return { hash, blockchainIds }
}

export const confirmDelivery = async (blockchainTxId) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "confirmDelivery",
    args: [BigInt(blockchainTxId)],
    account,
  })
  return await publicClient.waitForTransactionReceipt({ hash })
}
 
export const cancelTransaction = async (blockchainTxId) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "cancelTransaction",
    args: [BigInt(blockchainTxId)],
    account,
  })

  return await publicClient.waitForTransactionReceipt({ hash })
}

export const getPolPrice = async () => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token&vs_currencies=usd"
    );
    const data = await response.json();
    return data["polygon-ecosystem-token"].usd; 
  } catch (error) {
    console.error("Failed to fetch POL price:", error);
    throw new Error("Unable to get current market rates.");
  }
};