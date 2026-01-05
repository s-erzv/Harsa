"use client"

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  decodeEventLog,
  keccak256,
  encodeEventTopics
} from "viem"
import { polygonAmoy } from "viem/chains"
import abi from "./escrowAbi.json"

export const contractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS

export const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(),
})

export const getWalletClient = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return createWalletClient({
      chain: polygonAmoy,
      transport: custom(window.ethereum),
    })
  }
  throw new Error("Metamask tidak ditemukan")
}
export const buyProduct = async (sellerAddress, productId, amountKg, priceInPol) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()

  if (account.toLowerCase() === sellerAddress.toLowerCase()) {
    throw new Error("Tidak bisa membeli produk sendiri")
  }

  const totalValue = parseEther((Number(priceInPol) * Number(amountKg)).toFixed(18))

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "createTransaction",
    args: [sellerAddress, productId],
    account,
    value: totalValue,
    gas: 250000n,  
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  let blockchainId = null

  const eventTopics = encodeEventTopics({
    abi,
    eventName: 'TransactionCreated',
  })

  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() === contractAddress.toLowerCase() && 
      log.topics[0] === eventTopics[0]
    ) {
      try {
        const decoded = decodeEventLog({
          abi,
          data: log.data,
          topics: log.topics,
        })

        if (decoded.eventName === "TransactionCreated") {
          blockchainId = decoded.args.txId.toString()
          console.log("Berhasil ambil Blockchain ID:", blockchainId)
          break
        }
      } catch (e) {
        console.error("Gagal decode log:", e)
      }
    }
  }

  if (!blockchainId) {
    throw new Error("Gagal mengambil ID dari blockchain. Cek riwayat transaksi.")
  }

  return { hash, blockchainId }
}

export const confirmReceipt = async (blockchainTxId, supabaseTxId, supabase) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()

  console.log("🔍 Memulai Konfirmasi:", {
    txId: blockchainTxId,
    userWallet: account
  })

  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "confirmDelivery",
      args: [BigInt(blockchainTxId)], 
      account,
      gas: 300000n, 
    })

    console.log("Menunggu Konfirmasi Blockchain...", hash)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status !== "success") {
       throw new Error("Blockchain Reverted. Pastikan Anda adalah pembeli dan dana belum pernah dicairkan.")
    }

    const { error } = await supabase
      .from("transactions")
      .update({ status: "COMPLETED" })
      .eq("id", supabaseTxId)

    if (error) throw error

    return { success: true, hash }
  } catch (err) {
    console.error("Gagal cairkan dana detail:", err)
    throw err
  }
}