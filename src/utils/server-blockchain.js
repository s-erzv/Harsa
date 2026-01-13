import { createWalletClient, http, createPublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { arbitrumSepolia } from "viem/chains"
import { CONTRACT_ADDRESS, RPC_URL } from "./config"; // <--- Import dari sini

export const serverPublicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(RPC_URL),
})

export const getAdminClient = () => {
  const adminPK = process.env.ADMIN_PRIVATE_KEY 
  if (!adminPK) throw new Error("Admin Private Key missing on server");
  
  const privateKey = adminPK.startsWith('0x') ? adminPK : `0x${adminPK}`;
  const account = privateKeyToAccount(privateKey);
  
  return createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(RPC_URL)
  });
}

export { CONTRACT_ADDRESS }; // Export lagi biar API Route gampang ambilnya