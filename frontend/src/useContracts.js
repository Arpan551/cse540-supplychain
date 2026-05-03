// frontend/src/useContracts.js
// This hook handles two things: connecting MetaMask, and giving the rest of the
// app ready-to-use contract objects it can call functions on.
//
// We actually have two ways to talk to the blockchain:
//
//   readProvider — a direct connection to the local Hardhat node. This is used
//   for read-only calls like "look up product #3". The user doesn't need MetaMask
//   at all for this, which is important because regular consumers should be able
//   to look up products without installing any wallet software.
//
//   MetaMask signer — when someone clicks "Connect MetaMask", we get their signer
//   from MetaMask. This is required any time we want to send a transaction that
//   costs gas, like registering a product or transferring custody.
//
// If MetaMask is connected we use the signer for everything (reads and writes).
// If not, we fall back to readProvider for reads only.

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import ProductRegistryABI from "./abi/ProductRegistry.json";
import VerificationLogABI from "./abi/VerificationLog.json";

// These addresses come from frontend/.env — run deploy.js first and copy the
// printed addresses into that file. Vite picks them up at build/dev time.
export const CONTRACT_ADDRESSES = {
  productRegistry: import.meta.env.VITE_PRODUCT_REGISTRY || "",
  verificationLog: import.meta.env.VITE_VERIFICATION_LOG || "",
  accessControl:   import.meta.env.VITE_ACCESS_CONTROL   || "",
};

// A single shared connection to the local Hardhat node for read-only calls.
// If you deploy to Sepolia, swap this URL for a Sepolia RPC endpoint.
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

  function getAccessControl(conn) {
    if (!CONTRACT_ADDRESSES.accessControl) return null;
    // We only need a small slice of the AccessControl ABI here — just the
    // functions the Admin tab and the role badge detection actually use.
    // No need to import the full ABI JSON for a handful of functions.
    const abi = [
      "function addProducer(address) external",
      "function addDistributor(address) external",
      "function addRetailer(address) external",
      "function addRegulator(address) external",
      "function isProducer(address) external view returns (bool)",
      "function isDistributor(address) external view returns (bool)",
      "function isRetailer(address) external view returns (bool)",
      "function isRegulator(address) external view returns (bool)",
      "function hasRole(bytes32, address) external view returns (bool)",
      "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
    ];
    return new ethers.Contract(CONTRACT_ADDRESSES.accessControl, abi, conn);
  }

  return {
    account,
    signer,
    error,
    connect,
    // reads use direct RPC, writes use MetaMask signer
    registry:        getRegistry(signer || readProvider),
    verificationLog: getVerificationLog(signer || readProvider),
    accessControl:   getAccessControl(signer || readProvider),
  };
}
