import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem'
import { polygonAmoy } from 'viem/chains'
import abi from './escrowAbi.json' 
 
export const contractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS

export const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http()
})
 
export const getWalletClient = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: polygonAmoy,
      transport: custom(window.ethereum)
    })
  }
  return null
}

export const buyProduct = async (sellerAddress, productId, amountKg, priceInPol) => {
  if (!window.ethereum) throw new Error("metamask tidak ditemukan")
  const walletClient = getWalletClient()
  const [account] = await walletClient.getAddresses()
 
  if (account.toLowerCase() === sellerAddress.toLowerCase()) {
    throw new Error("anda tidak bisa membeli produk anda sendiri.")
  }

  const totalValue = parseEther((Number(priceInPol) * Number(amountKg)).toFixed(18))
  
  console.log("Debug Pay:", {
    val: totalValue.toString(),
    price: priceInPol,
    qty: amountKg
  })

  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: abi,
      functionName: 'createTransaction',
      args: [sellerAddress, productId],
      account,
      value: totalValue,
      gas: 150000n,  
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    let blockchainId = 0
    if (receipt.logs && receipt.logs.length > 0) {
      try {
        blockchainId = Number(BigInt(receipt.logs[0].topics[1]))
      } catch (e) {
        blockchainId = 1
      }
    }

    return { hash, blockchainId }
  } catch (err) {
    console.error("Detail Error Blockchain:", err)
    if (err.message.includes('insufficient funds')) {
       throw new Error("Saldo POL Amoy tipis banget, gak cukup buat bayar + gas fee.")
    }
    throw err
  }
}
 
export const confirmReceipt = async (blockchainTxId, supabaseTxId, supabase) => {
  if (!window.ethereum) throw new Error("metamask tidak ditemukan")
  const walletClient = getWalletClient()
  const [account] = await walletClient.getAddresses()

  try {  
    const balanceBefore = await publicClient.getBalance({ address: contractAddress })
    console.log("Saldo di Escrow saat ini:", balanceBefore.toString())

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: abi,
      functionName: 'confirmDelivery',
      args: [BigInt(blockchainTxId)],  
      account,
      gas: 200000n,  
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status === 'reverted') {
      throw new Error("Transaksi Blockchain GAGAL (Reverted). Duit belum pindah!")
    }

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'COMPLETED' })
      .eq('id', supabaseTxId)

    if (error) console.error("Database update error:", error)

    return { success: true, hash }
  } catch (err) {
    console.error("GAGAL TOTAL:", err.message)
    throw err
  }
}