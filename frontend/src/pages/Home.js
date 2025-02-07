import React from "react";

const Home = ({ contract }) => {
  return (
    <div style={styles.container}>
      <h2>Welcome to AI Model Marketplace</h2>
      <p>Buy and sell AI models using ERC-20 tokens.</p>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
  },
};

export default Home;
