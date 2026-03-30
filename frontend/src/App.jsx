// frontend/src/App.jsx
// Entry point for the React frontend.
// Connects to MetaMask, reads product data from the ProductRegistry contract,
// and allows authorized stakeholders to register products and update statuses.

import { useState } from "react";
import { ethers }   from "ethers";

// TODO: Replace with actual deployed contract addresses after deployment
const CONTRACT_ADDRESSES = {
  productRegistry: "0x0000000000000000000000000000000000000000",
  verificationLog: "0x0000000000000000000000000000000000000000",
};

export default function App() {
  const [account,  setAccount]  = useState(null);
  const [provider, setProvider] = useState(null);
  const [productId, setProductId] = useState("");
  const [productData, setProductData] = useState(null);
  const [status, setStatus] = useState("");

  // Connect MetaMask wallet
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    await web3Provider.send("eth_requestAccounts", []);
    const signer = await web3Provider.getSigner();
    setProvider(web3Provider);
    setAccount(await signer.getAddress());
    setStatus("Wallet connected.");
  }

  // Look up product provenance by product ID
  async function lookupProduct() {
    if (!provider) { setStatus("Connect wallet first."); return; }
    setStatus(`Looking up product ID ${productId}...`);
    // TODO: Instantiate ProductRegistry contract with ABI and address, then call getProduct()
    setProductData({ note: "Contract call placeholder — full implementation coming at midterm." });
    setStatus("Done.");
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "40px auto", padding: "0 20px" }}>
      <h1>Supply Chain Provenance System</h1>
      <p>CSE 540 Group 20 — Blockchain-Based Supply Chain Provenance</p>

      <hr />

      {!account ? (
        <button onClick={connectWallet}>Connect MetaMask</button>
      ) : (
        <p>Connected: {account}</p>
      )}

      <hr />

      <h2>Look Up Product</h2>
      <input
        type="number"
        placeholder="Enter Product ID"
        value={productId}
        onChange={e => setProductId(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={lookupProduct}>Lookup</button>

      {productData && (
        <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 4 }}>
          {JSON.stringify(productData, null, 2)}
        </pre>
      )}

      {status && <p><em>{status}</em></p>}
    </div>
  );
}
