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
import { privateKeyToAccount } from "viem/accounts"
import { arbitrumSepolia } from "viem/chains" 
import abiData from "./escrowAbi.json"

const abi = abiData.abi || abiData 
export const contractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc"),
})
// Helper untuk cek apakah window.ethereum tersedia
const getEthereum = () => {
  if (typeof window !== "undefined" && window.ethereum) return window.ethereum;
  return null;
};

export const getWalletClient = async () => {
  const eth = getEthereum();
  
  if (!eth) {
    // Biar gak error "uncaught in promise", kita throw error yang bisa ditangkep UI
    throw new Error("METAMASK_NOT_FOUND");
  }

  try {
    // Minta akses akun
    await eth.request({ method: 'eth_requestAccounts' });
    
    const walletClient = createWalletClient({
      chain: arbitrumSepolia,
      transport: custom(eth),
    });

    // Auto-switch network logic
    const currentChainId = await eth.request({ method: 'eth_chainId' });
    const targetChainId = `0x${arbitrumSepolia.id.toString(16)}`; 

    if (currentChainId !== targetChainId) {
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          alert("Please add Arbitrum Sepolia to your MetaMask.");
        }
      }
    }

    return walletClient;
  } catch (error) {
    throw new Error("USER_REJECTED_CONNECTION");
  }
}

export const checkout = async (items) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  
  const sellers = items.map(item => getAddress(item.sellerAddress))
  const skus = items.map(item => item.sku)
   
  // FIX: Kita hitung manual Wei-nya dulu satu-satu
  const amounts = items.map(item => {
    const rawValue = item.priceInEth || item.priceInPol || "0";
    // Pakai string toFixed(18) dan pastikan tidak ada scientific notation
    const formatted = parseFloat(rawValue).toFixed(18);
    return parseEther(formatted); 
  })
  
  // TOTAL HARUS DIHITUNG DARI ARRAY AMOUNTS YANG SAMA
  const totalValueWei = amounts.reduce((acc, curr) => acc + curr, 0n);

  console.log("Harsa Ledger Debug:");
  console.log("Total Wei to Send:", totalValueWei.toString());

  // VALIDASI SALDO
  const balance = await publicClient.getBalance({ address: account })
  if (balance < totalValueWei) {
    throw new Error(`Saldo ETH Sepolia tiris! Butuh ${totalValueWei.toString()} wei.`);
  }
 
  // PANGGIL CONTRACT DENGAN DATA YANG SUDAH SINKRON
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "checkout",
    args: [sellers, amounts, skus], 
    account,
    value: totalValueWei, // SEKARANG INI PASTI PAS SAMA TOTALRequired
    gas: 1000000n 
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  // Logic decoding tetap sama...
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
      } catch (e) { console.error("Log decode failed", e) }
    }
  }
  return { hash, blockchainIds }
}


export const confirmDelivery = async (blockchainTxId) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()

  // 1. Tambahkan pengecekan saldo gas (ETH Sepolia)
  const balance = await publicClient.getBalance({ address: account })
  if (balance === 0n) {
    throw new Error("You don't have enough ETH for gas fees on Arbitrum Sepolia.");
  }

  // 2. Gunakan try-catch internal untuk menangkap pesan error asli dari contract
  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "confirmDelivery",
      args: [BigInt(blockchainTxId)],
      account,
      // FIX: Paksa gas limit manual. 
      // 300,000n biasanya cukup untuk transaksi escrow sederhana.
      gas: 300000n 
    })
    
    return await publicClient.waitForTransactionReceipt({ hash })
  } catch (error) {
    // Log error lengkap buat debugging puitis kita
    console.error("Contract Call Failed:", error)
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
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const data = await response.json();
    return data["ethereum"].usd; 
  } catch (error) {
    console.error("Failed to fetch ETH price:", error);
    throw new Error("Unable to get current market rates.");
  }
};