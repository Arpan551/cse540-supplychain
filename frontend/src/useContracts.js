// frontend/src/useContracts.js
// React hook that manages wallet connection and returns typed contract instances.
<<<<<<< HEAD
// Read calls use a direct JsonRpcProvider to the local node (no MetaMask needed).
// Write calls use the MetaMask signer.
=======
>>>>>>> 0b8dcc4a1f2cc5c6afd970d89a91e8bd1ea2e432

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import ProductRegistryABI from "./abi/ProductRegistry.json";
import VerificationLogABI from "./abi/VerificationLog.json";

<<<<<<< HEAD
=======
// These are updated automatically by scripts/deploy.js via deployed-addresses.json.
// For local dev, replace with addresses printed by deploy.js.
>>>>>>> 0b8dcc4a1f2cc5c6afd970d89a91e8bd1ea2e432
export const CONTRACT_ADDRESSES = {
  productRegistry: import.meta.env.VITE_PRODUCT_REGISTRY || "",
  verificationLog: import.meta.env.VITE_VERIFICATION_LOG || "",
};

<<<<<<< HEAD
// Direct connection to local hardhat node for read-only calls
const readProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

export function useContracts() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner]   = useState(null);
  const [error, setError]     = useState(null);
=======
export function useContracts() {
  const [account, setAccount]     = useState(null);
  const [signer, setSigner]       = useState(null);
  const [provider, setProvider]   = useState(null);
  const [error, setError]         = useState(null);
>>>>>>> 0b8dcc4a1f2cc5c6afd970d89a91e8bd1ea2e432

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
<<<<<<< HEAD
=======
      setProvider(web3Provider);
>>>>>>> 0b8dcc4a1f2cc5c6afd970d89a91e8bd1ea2e432
      setSigner(s);
      setAccount(await s.getAddress());
    } catch (err) {
      setError(err.message);
    }
  }, []);

<<<<<<< HEAD
  function getRegistry(conn) {
    if (!CONTRACT_ADDRESSES.productRegistry) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.productRegistry, ProductRegistryABI, conn);
  }

  function getVerificationLog(conn) {
    if (!CONTRACT_ADDRESSES.verificationLog) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.verificationLog, VerificationLogABI, conn);
=======
  function getRegistry(signerOrProvider) {
    const conn = signerOrProvider || provider;
    if (!conn || !CONTRACT_ADDRESSES.productRegistry) return null;
    return new ethers.Contract(
      CONTRACT_ADDRESSES.productRegistry,
      ProductRegistryABI,
      conn
    );
  }

  //function verficiation get helper method
  function getVerificationLog(signerOrProvider) {
    const conn = signerOrProvider || provider;
    if (!conn || !CONTRACT_ADDRESSES.verificationLog) return null;
    return new ethers.Contract(
      CONTRACT_ADDRESSES.verificationLog,
      VerificationLogABI,
      conn
    );
>>>>>>> 0b8dcc4a1f2cc5c6afd970d89a91e8bd1ea2e432
  }

  return {
    account,
    signer,
<<<<<<< HEAD
    error,
    connect,
    // reads use direct RPC, writes use MetaMask signer
    registry:        getRegistry(signer || readProvider),
    verificationLog: getVerificationLog(signer || readProvider),
=======
    provider,
    error,
    connect,
    registry: signer ? getRegistry(signer) : (provider ? getRegistry(provider) : null),
    verificationLog: signer ? getVerificationLog(signer) : (provider ? getVerificationLog(provider) : null),
>>>>>>> 0b8dcc4a1f2cc5c6afd970d89a91e8bd1ea2e432
  };
}
