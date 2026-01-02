import { createPublicClient, createWalletClient, custom, http, parseEther, parseGwei } from 'viem'
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
 
const uuidToBigInt = (uuid) => {
  const hex = uuid.replace(/-/g, '')
  return BigInt('0x' + hex)
}

export const buyProduct = async (sellerAddress, productId, amountKg, priceInPol) => {
  if (!window.ethereum) throw new Error("metamask tidak ditemukan")

  const walletClient = getWalletClient()
  const [account] = await walletClient.getAddresses()
 
  if (account.toLowerCase() === sellerAddress.toLowerCase()) {
    throw new Error("anda tidak bisa membeli produk anda sendiri. gunakan akun lain untuk mengetes.")
  }

  const totalValue = parseEther((priceInPol * amountKg).toString())
  if (totalValue === 0n) throw new Error("total harga tidak boleh nol")

  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: abi,
      functionName: 'confirmDelivery',
      args: [cleanId],
      account,
      gas: 500000n
    })

    const tx = transactions.find(t => t.id === txId)

    await supabase.from('transactions').update({ status: 'COMPLETED' }).eq('id', txId)

    if (tx) {
      await supabase.from('notifications').insert({
        user_id: tx.seller_id,
        title: 'dana cair!',
        message: `dana sebesar rp ${tx.total_price.toLocaleString()} dari penjualan ${tx.product?.name} telah masuk ke saldo cair anda.`,
        type: 'SUCCESS'
      })
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    let blockchainId = 1
    if (receipt.logs && receipt.logs.length > 0) {
      blockchainId = Number(BigInt(receipt.logs[0].topics[1] || 1))
    }

    return { hash, blockchainId }
  } catch (err) {
    throw err
  }
}