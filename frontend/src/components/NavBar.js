import React from "react";
import { Link } from "react-router-dom";

const NavBar = ({ account, balance, connectWallet, disconnectWallet, refreshBalance }) => {
  return (
    <nav style={styles.nav}>
      <h1 style={styles.text}>AI Model Marketplace</h1>
      <div>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/list" style={styles.link}>List Model</Link>
      </div>
      <div style={styles.wallet}>
        {account ? (
          <>
            <p style={styles.text}>Wallet: {account.substring(0, 6)}...{account.slice(-4)}</p>
            <p style={styles.text}>ERC-20 Balance: {Number(balance).toFixed(4)} Tokens</p>
            <button onClick={refreshBalance} style={styles.buttonRefresh}>Refresh Balance</button>
            <button onClick={disconnectWallet} style={styles.buttonDisconnect}>Disconnect</button>
          </>
        ) : (
          <button onClick={connectWallet} style={styles.button}>Connect Wallet</button>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#3E5C76",
    color: "#FFFFFF",
  },
  text: {
    color: "#FFFFFF",
  },
  link: {
    margin: "0 10px",
    color: "#FFFFFF",
    textDecoration: "none",
    fontSize: "18px",
  },
  wallet: {
    textAlign: "right",
  },
  button: {
    padding: "10px 15px",
    fontSize: "16px",
    backgroundColor: "#5A7D9A",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
  },
  buttonDisconnect: {
    padding: "10px 15px",
    fontSize: "16px",
    backgroundColor: "#DC3545",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    marginTop: "5px",
  },
  buttonRefresh: {
    padding: "8px 12px",
    fontSize: "14px",
    backgroundColor: "#28A745",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    marginRight: "5px",
  },
};

export default NavBar;
