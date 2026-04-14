// frontend/src/useContracts.js
// React hook that manages wallet connection and returns typed contract instances.
// Read calls use a direct JsonRpcProvider to the local node (no MetaMask needed).
// Write calls use the MetaMask signer.

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import ProductRegistryABI from "./abi/ProductRegistry.json";
import VerificationLogABI from "./abi/VerificationLog.json";

export const CONTRACT_ADDRESSES = {
  productRegistry: import.meta.env.VITE_PRODUCT_REGISTRY || "",
  verificationLog: import.meta.env.VITE_VERIFICATION_LOG || "",
};

// Direct connection to local hardhat node for read-only calls
const readProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

export function useContracts() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner]   = useState(null);
  const [error, setError]     = useState(null);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("MetaMask not detected. Install MetaMask and try again.");
      return;
    }
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const s = await web3Provider.getSigner();
      setSigner(s);
      setAccount(await s.getAddress());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  function getRegistry(conn) {
    if (!CONTRACT_ADDRESSES.productRegistry) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.productRegistry, ProductRegistryABI, conn);
  }

  function getVerificationLog(conn) {
    if (!CONTRACT_ADDRESSES.verificationLog) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.verificationLog, VerificationLogABI, conn);
  }

  return {
    account,
    signer,
    error,
    connect,
    // reads use direct RPC, writes use MetaMask signer
    registry:        getRegistry(signer || readProvider),
    verificationLog: getVerificationLog(signer || readProvider),
  };
}
