import { getAdminClient, serverPublicClient, CONTRACT_ADDRESS } from "@/utils/server-blockchain";
import abiData from "@/utils/escrowAbi.json";
import { NextResponse } from "next/server";

const abi = abiData.abi || abiData;

const bigIntReplacer = (key, value) => {
  return typeof value === "bigint" ? value.toString() : value;
};

export async function POST(req) {
  try {
    const { blockchainTxId } = await req.json();
    const adminClient = getAdminClient();

    const hash = await adminClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "confirmDelivery",
      args: [BigInt(blockchainTxId)],
      gas: 500000n
    });

    const receipt = await serverPublicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "reverted") {
      return NextResponse.json({ 
        success: false, 
        error: "Blockchain Transaction Reverted: 'Invalid status' or 'Unauthorized'" 
      }, { status: 400 });
    }

    const safeReceipt = JSON.parse(JSON.stringify(receipt, bigIntReplacer));

    return NextResponse.json({ success: true, hash, receipt: safeReceipt });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}