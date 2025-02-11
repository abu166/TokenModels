import React, { useState } from "react";
import { parseUnits } from "ethers";
import "bootstrap/dist/css/bootstrap.min.css";

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
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#EAF2F8" }}>
      <div className="container p-4 shadow-lg rounded-3" style={{ maxWidth: "500px", backgroundColor: "#D4E6F1", color: "#3E5C76" }}>
        <h2 className="text-center mb-4">List New AI Model</h2>
        {error && <div className="alert alert-danger text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Model Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Price (ERC)</label>
            <input
              type="number"
              step="0.0001"
              className="form-control"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Upload Model File</label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
              accept=".zip,.json,.h5,.onnx"
            />
            {formData.file && <p className="small mt-1">Selected File: {formData.file.name}</p>}
          </div>
          <button type="submit" className="btn w-100" style={{ backgroundColor: "#7BA7C7", color: "white" }} disabled={loading || !account}>
            {loading ? "Processing..." : "List Model"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ListModel;