import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import Home from "./pages/Home";
import ListModel from "./pages/ListModel";
import NavBar from "./components/NavBar";
import { CONTRACT_ADDRESS, CONTRACT_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "./config";

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  const initializeContracts = useCallback(async (signer) => {
    const mainContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const token = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
    setContract(mainContract);
    setTokenContract(token);
    return token;
  }, []);

  const loadAccountData = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      setProvider(provider);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const token = await initializeContracts(signer);
        
        setAccount(accounts[0]);
        const balanceRaw = await token.balanceOf(accounts[0]);
        setBalance(formatUnits(balanceRaw, 18));
      }
    } catch (error) {
      console.error("Error connecting:", error);
    }
  }, [initializeContracts]);

  const checkWalletConnection = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        await initializeContracts(signer);
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  }, [initializeContracts]);

  const refreshBalance = async () => {
    if (!account || !tokenContract) return;
    
    try {
      const balanceRaw = await tokenContract.balanceOf(account);
      setBalance(formatUnits(balanceRaw, 18));
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  };

  useEffect(() => {
    checkWalletConnection();
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          handleDisconnect();
        }
      });
    }
  }, [checkWalletConnection]);

  const handleDisconnect = () => {
    setAccount(null);
    setBalance(0);
    setContract(null);
    setProvider(null);
  };

  return (
    <Router>
      <NavBar 
        account={account}
        balance={balance}
        connectWallet={loadAccountData}
        disconnectWallet={handleDisconnect}
        refreshBalance={refreshBalance}
      />
      
      <Routes>
        <Route path="/" element={<Home contract={contract} account={account} />} />
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