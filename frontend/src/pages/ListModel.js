import React, { useState } from "react";
import { parseUnits } from "ethers";

const ListModel = ({ contract, account, provider, refreshModels }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    fileHash: "",
    file: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fakeIPFSHash = URL.createObjectURL(file);
      console.log("Fake IPFS hash:", fakeIPFSHash);
      setFormData({ ...formData, file, fileHash: fakeIPFSHash });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!provider || !account) {
        throw new Error("Wallet not connected");
      }

      if (!contract) {
        throw new Error("Marketplace contract not loaded");
      }

      if (!formData.fileHash) {
        throw new Error("Please upload a file or provide a model link.");
      }

      const priceInWei = parseUnits(formData.price, 18);
      const tx = await contract.listModel(
        formData.name,
        formData.description,
        priceInWei,
        formData.fileHash
      );

      await tx.wait();
      alert("Model listed successfully!");
      setFormData({ name: "", description: "", price: "", fileHash: "", file: null });

      if (typeof refreshModels === "function") {
        refreshModels();
      }
    } catch (err) {
      setError(err.reason || err.message);
      console.error("Listing error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="list-model-container">
      <h2>List New AI Model</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Model Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Price (ERC)</label>
          <input
            type="number"
            step="0.0001"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Upload Model File</label>
          <input type="file" onChange={handleFileChange} accept=".zip,.json,.h5,.onnx" />
          {formData.file && <p>Selected File: {formData.file.name}</p>}
        </div>
        <button type="submit" disabled={loading || !account}>
          {loading ? "Processing..." : "List Model"}
        </button>
      </form>
    </div>
  );
};

export default ListModel;
