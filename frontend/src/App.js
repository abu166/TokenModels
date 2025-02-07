import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    async function loadBlockchainData() {
      if (window.ethereum && account) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          // Connect Smart Contract
          const mainContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setContract(mainContract);

          // Fetch ERC-20 Token Balance
          if (TOKEN_ADDRESS && TOKEN_ABI) {
            const tokenContract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
            const balanceRaw = await tokenContract.balanceOf(account);
            setBalance(formatUnits(balanceRaw, 18)); // Convert from wei
          }
        } catch (error) {
          console.error("Error loading blockchain data:", error);
        }
      }
    }

    loadBlockchainData();
  }, [account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAccount = accounts[0];

        setAccount(userAccount);
        localStorage.setItem("account", userAccount); // Save account to localStorage

        // Update balance after connecting
        const signer = await provider.getSigner();
        const tokenContract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
        const balanceRaw = await tokenContract.balanceOf(userAccount);
        setBalance(formatUnits(balanceRaw, 18));
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install Metamask!");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(0);
    localStorage.removeItem("account"); // Remove account from localStorage
  };

  return (
    <Router>
      <NavBar account={account} balance={balance} connectWallet={connectWallet} disconnectWallet={disconnectWallet} />
      <Routes>
        <Route path="/" element={<Home contract={contract} />} />
        <Route path="/list" element={<ListModel contract={contract} />} />
      </Routes>
    </Router>
  );
}

export default App;
