import React, { useState } from "react";

const ListModel = ({ contract }) => {
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Smart contract not loaded.");

    try {
      const tx = await contract.listModel(modelName, description, price);
      await tx.wait();
      alert("Model listed successfully!");
    } catch (error) {
      console.error(error);
      alert("Error listing model.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>List Your AI Model</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Model Name"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Price (in ERC-20 Tokens)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <button type="submit">List Model</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

export default ListModel;
