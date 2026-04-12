// frontend/src/useContracts.js
// React hook that manages wallet connection and returns typed contract instances.

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import ProductRegistryABI from "./abi/ProductRegistry.json";
import VerificationLogABI from "./abi/VerificationLog.json";

// These are updated automatically by scripts/deploy.js via deployed-addresses.json.
// For local dev, replace with addresses printed by deploy.js.
export const CONTRACT_ADDRESSES = {
  productRegistry: import.meta.env.VITE_PRODUCT_REGISTRY || "",
  verificationLog: import.meta.env.VITE_VERIFICATION_LOG || "",
};

export function useContracts() {
  const [account, setAccount]     = useState(null);
  const [signer, setSigner]       = useState(null);
  const [provider, setProvider]   = useState(null);
  const [error, setError]         = useState(null);

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
      setProvider(web3Provider);
      setSigner(s);
      setAccount(await s.getAddress());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  function getRegistry(signerOrProvider) {
    const conn = signerOrProvider || provider;
    if (!conn || !CONTRACT_ADDRESSES.productRegistry) return null;
    return new ethers.Contract(
      CONTRACT_ADDRESSES.productRegistry,
      ProductRegistryABI,
      conn
    );
  }

  function getVerificationLog(signerOrProvider) {
    const conn = signerOrProvider || provider;
    if (!conn || !CONTRACT_ADDRESSES.verificationLog) return null;
    return new ethers.Contract(
      CONTRACT_ADDRESSES.verificationLog,
      VerificationLogABI,
      conn
    );
  }

  return {
    account,
    signer,
    provider,
    error,
    connect,
    registry: signer ? getRegistry(signer) : (provider ? getRegistry(provider) : null),
    verificationLog: signer ? getVerificationLog(signer) : (provider ? getVerificationLog(provider) : null),
  };
}
