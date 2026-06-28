// src/context/Web3Context.js
// Manages MetaMask connection, ethers.js provider, and contract instance

import React, { createContext, useContext, useState, useCallback } from "react";
import { ethers }          from "ethers";
import VotingABI           from "../utils/contractABI";
import { CONTRACT_ADDRESS, CHAIN_ID, HARDHAT_NETWORK } from "../utils/config";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account,   setAccount]   = useState(null);   // Connected wallet address
  const [provider,  setProvider]  = useState(null);   // ethers BrowserProvider
  const [contract,  setContract]  = useState(null);   // Contract instance (read/write)
  const [chainId,   setChainId]   = useState(null);   // Current network chain ID
  const [connecting, setConnecting] = useState(false);

  // ── Connect MetaMask ────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed! Please install it from metamask.io");
      return null;
    }

    try {
      setConnecting(true);

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Switch to Hardhat local network if needed
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (parseInt(currentChainId, 16) !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: HARDHAT_NETWORK.chainId }],
          });
        } catch (switchError) {
          // Network not added to MetaMask — add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [HARDHAT_NETWORK],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Set up ethers provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer       = await web3Provider.getSigner();
      const network      = await web3Provider.getNetwork();

      // Create contract instance with signer (for write operations)
      const votingContract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setContract(votingContract);
      setChainId(Number(network.chainId));

      return accounts[0];
    } catch (error) {
      console.error("Wallet connection error:", error.message);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── Disconnect (clear local state) ─────────────────────────────────
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setChainId(null);
  };

  // ── Get a read-only contract (no signer needed) ─────────────────────
  const getReadOnlyContract = useCallback(() => {
    if (!window.ethereum) return null;
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(CONTRACT_ADDRESS, VotingABI, web3Provider);
  }, []);

  // ── Listen for MetaMask account & network changes ───────────────────
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    });

    window.ethereum.on("chainChanged", () => {
      // Reload page on network change (recommended by MetaMask)
      window.location.reload();
    });
  }

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        contract,
        chainId,
        connecting,
        connectWallet,
        disconnectWallet,
        getReadOnlyContract,
        isCorrectNetwork: chainId === CHAIN_ID,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook for easy access
export const useWeb3 = () => useContext(Web3Context);
