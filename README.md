# 🌿 Harsa Protocol: Agri-DeFi Infrastructure
### *Revolutionizing Global Agricultural Supply Chains on Arbitrum L2*

**Live Demo:** [harsaarbi.vercel.app](https://harsaarbi.vercel.app)  )

---

## Abstract
Harsa is a hybrid Agri-DeFi (Agricultural Decentralized Finance) infrastructure designed to overhaul trust systems within global agricultural supply chains. By positioning the **Arbitrum blockchain** as a single source of truth, Harsa integrates a commodity marketplace, automated escrow protocols, and QR-based traceability to eliminate intermediary exploitation and price asymmetry.

## Arbitrum Integration
Harsa is built on **Arbitrum Sepolia** to provide a high-performance, low-cost experience that is realistic for rural adoption.

* **Gasless Experience:** vital functions like `confirmDelivery` are executed via a server-side client (**Viem**), subsidizing gas fees to remove the complexity of token management for farmers.
* **On-Chain Settlement:** Utilizes the `HarsaEscrow` smart contract to lock funds. Payments are only released once delivery is cryptographically verified.
* **Data Anchoring:** While granular logs are stored efficiently in Supabase, every critical status change (Dispatched, Transit, Received) is anchored to the blockchain via a `tx_hash` for an immutable audit trail.
* **Stylus & Orbit Roadmap:** Future plans include migrating reputation algorithms to **Arbitrum Stylus (Rust)** for 10x computational efficiency and deploying a dedicated agricultural rollup via **Arbitrum Orbit**.

## Key Features
* **Hybrid Infrastructure:** Functions as both a marketplace and an independent Escrow-as-a-Service protocol.
* **Non-Atomic Multi-Seller Checkout:** Ensuring financial fairness; delays from one farmer do not stall payments to others in a bundled order.
* **QR-Proof of Delivery:** Seamlessly bridge physical hand-offs with digital settlement using QR-based verification.
* **Global Market Intelligence:** Real-time commodity price indices (via API Ninjas) integrated into the dashboard to help farmers set fair prices.
* **Obsidian Intelligence Dashboard:** Clean, poetic UI for analytics, sales monitoring, and encrypted P2P communication.

## Tech Stack
* **L2 Network:** Arbitrum Sepolia
* **Smart Contracts:** Solidity (HarsaEscrow)
* **Frontend:** Next.js 15 (Turbopack), Tailwind CSS 4
* **Backend/Database:** Supabase (PostgreSQL + Realtime)
* **Blockchain Library:** Viem & Ethers.js
* **Security:** AES-256 End-to-End Encryption for P2P Chat
* **Visuals:** Lucide React, Recharts, Framer Motion

## Future Roadmap
1.  **Arbitrum Stylus Integration:** Migrating heavy business analytics to Rust-based smart contracts.
2.  **IoT Hardware Verification:** Replacing manual farm logs with real-time sensor data (Soil moisture, GPS trackers) anchored directly to the chain.
3.  **Arbitrum Orbit Deployment:** Building a dedicated Agri-Rollup for high-frequency IoT data and global scaling.
4.  **DAO Governance:** Transitioning to a community-led model on Arbitrum One.

---
*Built with intention and a touch of poetic logic for the Arbitrum Mini Hackathon 2026.* 🌿✨
