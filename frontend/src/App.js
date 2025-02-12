import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import Home from "./pages/Home";
import ListModel from "./pages/ListModel";
import NavBar from "./components/NavBar";
import { CONTRACT_ADDRESS, CONTRACT_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "./config";

function App() {
  const [account, setAccount] = useState(localStorage.getItem("account") || null);
  const [balance, setBalance] = useState(0);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  const initializeContracts = useCallback(async (signer) => {

    if (!signer) {
      console.error("Signer is undefined or null.");
      return null;
    }

    try {
      const mainContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const token = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      setContract(mainContract);
      setTokenContract(token);
      return token;
    } catch (error) {
      console.error("Error initializing contracts:", error);
      return null;
    }
  }, []);

  const resetState = useCallback(() => {
    setAccount(null);
    setBalance(0);
    setContract(null);
    setProvider(null);
    setSigner(null);
    setTokenContract(null);
    localStorage.removeItem("account");
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      if (window.ethereum) {
        resetState();
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    } finally {
      window.location.reload(); 
    }  
  }, [resetState]);

  const refreshBalance = useCallback(async () => {
    if (!account || !tokenContract) {
      console.warn("Skipping balance refresh: Account or token contract is missing.");
      return;
    }
    
    try {
      const balanceRaw = await tokenContract.balanceOf(account);
      setBalance(formatUnits(balanceRaw, 18));
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  }, [account, tokenContract]);

  const setupWalletConnection = useCallback(async (accounts) => {
    if (!window.ethereum || accounts.length === 0) return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      localStorage.setItem("account", accounts[0]);
      
      const token = await initializeContracts(signer);
      if (token) {
        const balanceRaw = await token.balanceOf(accounts[0]);
        setBalance(formatUnits(balanceRaw, 18));
      }
    } catch (error) {
      console.error("Error setting up wallet connection:", error);
      resetState();
    } 
  }, [initializeContracts, resetState]);

  useEffect(() => {
    const checkInitialConnection = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ 
          method: "eth_accounts" 
        });
        if (accounts.length > 0) {
          await setupWalletConnection(accounts);
        } else {
          resetState();
        }
      } catch (error) {
        console.error("Error checking initial connection:", error);
        resetState();
      }
    };
    checkInitialConnection();
  }, [setupWalletConnection, resetState]);


  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        await setupWalletConnection(accounts);
      } else {
        await handleDisconnect();
      }
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [setupWalletConnection, handleDisconnect]);

  return (
    <Router>
      <NavBar 
        account={account}
        balance={balance}
        connectWallet={setupWalletConnection}
        disconnectWallet={handleDisconnect}
        refreshBalance={refreshBalance}
      />
      
      <Routes>
        <Route path="/" element={<Home provider={provider} signer={signer} account={account} tokenContract={tokenContract}  />} />
        <Route 
          path="/list" 
          element={
            <ListModel 
              contract={contract} 
              account={account}
              provider={provider}
              tokenAddress={TOKEN_ADDRESS}
            />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
