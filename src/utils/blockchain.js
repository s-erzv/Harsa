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

const getEthereum = () => (typeof window !== "undefined" && window.ethereum ? window.ethereum : null);

export const getWalletClient = async () => {
  const eth = getEthereum();
  if (!eth) throw new Error("METAMASK_NOT_FOUND");
  try {
    await eth.request({ method: 'eth_requestAccounts' });
    const walletClient = createWalletClient({ chain: arbitrumSepolia, transport: custom(eth) });
    const currentChainId = await eth.request({ method: 'eth_chainId' });
    const targetChainId = `0x${arbitrumSepolia.id.toString(16)}`; 
    if (currentChainId !== targetChainId) {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetChainId }] });
    }
    return walletClient;
  } catch (error) {
    throw new Error("USER_REJECTED_CONNECTION");
  }
}

export const checkout = async (items, isWithNego = false, proposedPriceEth = null) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  
  // 1. Generate Amounts dengan presisi 18 desimal
  const amounts = items.map(item => parseEther(parseFloat(item.priceInEth).toFixed(18)));
  
  // 2. Hitung Total Value dari array amounts (BigInt ke BigInt)
  // Ini kunci agar msg.value >= totalRequired terpenuhi sempurna
  const totalValueWei = amounts.reduce((acc, curr) => acc + curr, 0n);

  try {
    // 3. Simulasi kontrak sebelum eksekusi (menangkap error sebelum bayar gas)
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName: "checkout",
      args: [items.map(i => getAddress(i.sellerAddress)), amounts, items.map(i => i.sku)],
      value: totalValueWei,
      account,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    // 4. Ambil ID Transaksi dari log
    const eventTopics = encodeEventTopics({ abi, eventName: 'TransactionCreated' });
    const log = receipt.logs.find(l => l.address.toLowerCase() === contractAddress.toLowerCase() && l.topics[0] === eventTopics[0]);
    const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics });
    const txId = BigInt(decoded.args.txId);
    const originalWei = BigInt(decoded.args.amount);

    let negoSuccess = false;

    // 5. Eksekusi Nego jika terpilih
    if (isWithNego && proposedPriceEth) {
      const proposedWei = parseEther(parseFloat(proposedPriceEth).toFixed(18));
      // Validasi: Nego harus lebih rendah dari harga asli
      if (proposedWei < originalWei) {
          try {
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
          } catch (e) {
              console.error("Nego Reverted on Blockchain:", e.shortMessage);
          }
      }
    }

    return { hash, blockchainIds: [{ txId: txId.toString() }], negoSuccess };
  } catch (error) {
    console.error("BLOCKCHAIN_ERROR:", error.shortMessage || error.message);
    throw error;
  }
}

export const getEthPrice = async () => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
    const data = await response.json();
    return data["ethereum"].usd; 
  } catch (error) { throw new Error("Rates unavailable"); }
};

export const respondToNegotiation = async (blockchainTxId, accept) => {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName: "respondToNegotiation",
      args: [BigInt(blockchainTxId), accept],
      account,
    });
    const hash = await walletClient.writeContract(request);
    return await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    throw new Error(error.shortMessage || "Action rejected. Verify your role.");
  }
};

export const confirmDelivery = async (blockchainTxId) => {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName: "confirmDelivery",
      args: [BigInt(blockchainTxId)],
      account,
    });
    const hash = await walletClient.writeContract(request);
    return await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) { throw error; }
};

export const cancelTransaction = async (blockchainTxId) => {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "cancelTransaction",
    args: [BigInt(blockchainTxId)],
    account,
  });
  return await publicClient.waitForTransactionReceipt({ hash });
};