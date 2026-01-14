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
import { arbitrumSepolia } from "viem/chains" 
import abiData from "./escrowAbi.json"

const abi = abiData.abi || abiData 
export const contractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc"),
})

const getEthereum = () => {
  if (typeof window !== "undefined" && window.ethereum) return window.ethereum;
  return null;
};

export const getWalletClient = async () => {
  const eth = getEthereum();
  if (!eth) throw new Error("METAMASK_NOT_FOUND");
  try {
    await eth.request({ method: 'eth_requestAccounts' });
    const walletClient = createWalletClient({
      chain: arbitrumSepolia,
      transport: custom(eth),
    });
    const currentChainId = await eth.request({ method: 'eth_chainId' });
    const targetChainId = `0x${arbitrumSepolia.id.toString(16)}`; 
    if (currentChainId !== targetChainId) {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    }
    return walletClient;
  } catch (error) {
    throw new Error("USER_REJECTED_CONNECTION");
  }
}

export const checkout = async (items, isWithNego = false, proposedPriceEth = null) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  
  const sellers = items.map(item => getAddress(item.sellerAddress))
  const skus = items.map(item => item.sku)
   
  const amounts = items.map(item => {
    const rawValue = item.priceInEth || "0";
    return parseEther(parseFloat(rawValue).toFixed(18)); 
  })
  
  const totalValueWei = amounts.reduce((acc, curr) => acc + curr, 0n);

  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName: "checkout",
      args: [sellers, amounts, skus],
      value: totalValueWei,
      account,
    });

    const hash = await walletClient.writeContract(request);
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
        } catch (e) { console.error("Decode failed", e) }
      }
    }

    let negoSuccess = false;
    if (isWithNego && blockchainIds.length > 0 && proposedPriceEth) {
      try {
          const txId = BigInt(blockchainIds[0].txId);
          const proposedWei = parseEther(parseFloat(proposedPriceEth).toFixed(18));
          const originalWei = BigInt(blockchainIds[0].amount);

          if (proposedWei < originalWei) {
              const { request: negoReq } = await publicClient.simulateContract({
                address: contractAddress,
                abi,
                functionName: "proposeNegotiation",
                args: [txId, proposedWei],
                account,
              });
              const negoHash = await walletClient.writeContract(negoReq);
              await publicClient.waitForTransactionReceipt({ hash: negoHash });
              negoSuccess = true;
          }
      } catch (negoError) {
          console.error("Nego Reverted:", negoError.shortMessage || negoError.message);
      }
    }

    return { hash, blockchainIds, negoSuccess }

  } catch (error) {
    console.error("CHECKOUT_ERROR:", error.shortMessage || error.message);
    throw error;
  }
}

export const confirmDelivery = async (blockchainTxId) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName: "confirmDelivery",
      args: [BigInt(blockchainTxId)],
      account,
    });
    const hash = await walletClient.writeContract(request);
    return await publicClient.waitForTransactionReceipt({ hash })
  } catch (error) {
    throw error
  }
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

export const getEthPrice = async () => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
    const data = await response.json();
    return data["ethereum"].usd; 
  } catch (error) {
    throw new Error("Rates unavailable");
  }
};

export const proposeNegotiation = async (blockchainTxId, proposedPriceEth) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  const cleanValue = parseFloat(proposedPriceEth).toFixed(18);
  const proposedWei = parseEther(cleanValue)
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "proposeNegotiation",
    args: [BigInt(blockchainTxId), proposedWei],
    account,
  })
  return await publicClient.waitForTransactionReceipt({ hash })
}

export const respondToNegotiation = async (blockchainTxId, accept) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  const txId = BigInt(blockchainTxId);
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName: "respondToNegotiation",
      args: [txId, accept],
      account,
    });
    const hash = await walletClient.writeContract(request);
    return await publicClient.waitForTransactionReceipt({ hash })
  } catch (error) {
    throw new Error(error.shortMessage || "Check Seller authorization");
  }
}