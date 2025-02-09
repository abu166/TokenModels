import React, { useEffect, useState } from "react";
import { formatUnits } from "ethers";

const Home = ({ contract, account }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      if (!contract) return;
      
      try {
        const count = await contract.modelCount();
        const modelsArray = [];
        
        for (let i = 1; i <= count; i++) {
          const model = await contract.models(i);
          modelsArray.push({
            id: i,
            name: model.name,
            description: model.description,
            price: model.price,
            seller: model.seller,
            isSold: model.isSold
          });
        }
        
        setModels(modelsArray);
      } catch (err) {
        console.error("Error loading models:", err);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [contract]);

  const handlePurchase = async (modelId, price) => {
    if (!contract || !account) return;
    
    try {
      const tx = await contract.purchaseModel(modelId, { value: price });
      await tx.wait();
      alert("Purchase successful!");
    } catch (err) {
      console.error("Purchase failed:", err);
      alert(err.reason || "Purchase failed");
    }
  };

  return (
    <div className="model-list">
      <h1>Available AI Models</h1>
      {loading ? (
        <p>Loading models...</p>
      ) : (
        models.map((model) => (
          <div key={model.id} className="model-card">
            <h3>{model.name}</h3>
            <p>{model.description}</p>
            <p>Price: {formatUnits(model.price, 18)} Tokens</p>
            <p>Seller: {model.seller.slice(0, 6)}...{model.seller.slice(-4)}</p>
            <button 
              onClick={() => handlePurchase(model.id, model.price)}
              disabled={!account || model.isSold}
            >
              {model.isSold ? "Sold" : "Purchase"}
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default Home;