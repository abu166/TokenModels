import React, { useEffect, useState, useCallback } from "react";
import { formatEther, parseUnits, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config";

const Home = ({ provider, signer, tokenContract }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState(null);
    const [selectedRatings, setSelectedRatings] = useState({});
    
    useEffect(() => {
        const fetchAccount = async () => {
            if (signer) {
                try {
                    const address = await signer.getAddress();
                    setAccount(address);
                } catch (error) {
                    console.error("Error fetching account:", error);
                }
            }
        };
        fetchAccount();
    }, [signer]);

    const fetchModels = useCallback(async () => {
        if (!provider) return;
        setLoading(true);
        try {
            const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
            const modelCount = await contract.getModelCount();
            const count = parseInt(modelCount.toString(), 10);

            let modelsArray = [];
            for (let i = 1; i <= count; i++) {
                try {
                    const model = await contract.models(i);
                    if (model.exists && model.seller !== "0x0000000000000000000000000000000000000000") {
                        const hasRated = account ? await contract.hasRated(i, account) : false;
                        const totalRating = model.totalRating.toString();
                        const ratingCount = model.ratingCount.toString();
                        const averageRating = ratingCount === '0' ? 0 : 
                            (parseInt(totalRating) / parseInt(ratingCount)).toFixed(1);

                        modelsArray.push({
                            id: i,
                            name: model.name,
                            description: model.description,
                            price: formatEther(model.price),
                            owner: model.seller,
                            purchased: model.isSold,
                            averageRating,
                            hasRated,
                            totalRating,
                            ratingCount
                        });
                    }
                } catch (error) {
                    console.warn(`Skipping model with ID ${i}`);
                }
            }

            modelsArray.reverse();
            setModels(modelsArray);
        } catch (error) {
            console.error("Error fetching models:", error);
            setModels([]);
        } finally {
            setLoading(false);
        }
    }, [provider, account]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);
  

    const buyModel = async (id, price, owner) => {
        if (!signer || !tokenContract) {
            alert("Please connect your wallet.");
            return;
        }

        if (owner.toLowerCase() === account.toLowerCase()) {
            alert("You cannot buy your own model.");
            return;
        }

        try {
            const priceInWei = parseUnits(price.toString(), 18);
            const userBalance = await tokenContract.balanceOf(account);
            if (userBalance < priceInWei) {
                alert("Insufficient ERC-20 token balance.");
                return;
            }

            const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, priceInWei);
            await approveTx.wait();

            const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const tx = await contract.buyModel(id);
            await tx.wait();

            alert("Purchase successful!");
            fetchModels();
        } catch (error) {
            console.error("Purchase failed:", error);
            alert(`Transaction failed: ${error.reason || error.message}`);
        }
    };

    const deleteModel = async (id) => {
        if (!signer) {
            alert("Please connect your wallet.");
            return;
        }

        try {
            const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const tx = await contract.deleteModel(id);
            await tx.wait();
            alert("Model deleted successfully!");
            fetchModels();
        } catch (error) {
            console.error("Deletion failed:", error);
            alert("Transaction failed. See console for details.");
        }
    };

    const rateModel = async (modelId) => {
        const rating = selectedRatings[modelId];
        if (typeof rating === 'undefined' || rating < 1 || rating > 5) {
            alert("Please select a valid rating between 1 and 5.");
            return;
        }

        if (!signer) {
            alert("Please connect your wallet.");
            return;
        }

        try {
            const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const tx = await contract.rateModel(modelId, rating);
            await tx.wait();
            
            setSelectedRatings(prev => {
                const newState = { ...prev };
                delete newState[modelId];
                return newState;
            });
            
            alert("Rating submitted successfully!");
            fetchModels();
        } catch (error) {
            console.error("Rating submission failed:", error);
            alert(`Transaction failed: ${error.reason || error.message}`);
        }
    };

    const yourModels = models.filter(model => model.owner.toLowerCase() === account?.toLowerCase());
    const availableModels = models.filter(model => model.owner.toLowerCase() !== account?.toLowerCase() && !model.purchased);
    const soldModels = models.filter(model => model.purchased);

    return (
        <div>
            <h1>AI Model Marketplace</h1>
            {loading ? (
                <p>Loading models...</p>
            ) : (
                <div>
                    {yourModels.length > 0 && (
           <div>
             <h2>📌 Your Models</h2>
                         {yourModels.map((model) => (
                                <div 
                                    key={model.id} 
                                    style={{ 
                                        border: "1px solid #ccc", 
                                        padding: "10px", 
                                        margin: "10px", 
                                        background: model.purchased ? "#ffd6d6" : "#f9f9f9" 
                                    }}
                                >
                                    <h2>{model.name}</h2>
                                    <p>{model.description}</p>
                                    <p>Price: {model.price} ERC</p>
                                    <p>Owner: You</p>

                                    {/* Display Average Rating as Emoji Stars */}
                                    {model.purchased && (
                                        <p>
                                            Average Rating: 
                                            {" " + "⭐".repeat(Math.round(model.averageRating)) + "☆".repeat(5 - Math.round(model.averageRating))}
                                        </p>
                                    )}

                                    {model.purchased && <p style={{ color: "red", fontWeight: "bold" }}>SOLD</p>}

                                    {!model.purchased && (
                                        <button 
                                            onClick={() => deleteModel(model.id)} 
                                            style={{ marginLeft: "10px", background: "red", color: "white" }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}


                    {availableModels.length > 0 && (
                        <div>
                            <h2>🌎 Available Models</h2>
                            {availableModels.map((model) => (
                                <div key={model.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
                                    <h2>{model.name}</h2>
                                    <p>{model.description}</p>
                                    <p>Price: {model.price} ERC</p>
                                    <p>Owner: {model.owner}</p>
                                    {account && (
                                        <button onClick={() => buyModel(model.id, model.price, model.owner)}>
                                            Buy
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {soldModels.length > 0 && (
                        <div>
                            <h2>🔴 Sold Models</h2>
                            {soldModels.map((model) => (
                              <div key={model.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px", background: "#ffd6d6" }}>
                                  <h2>{model.name}</h2>
                                  <p>{model.description}</p>
                                  <p>Price: {model.price} ERC</p>
                                  <p>Owner: {model.owner}</p>

                                  {/* Average Rating Display (Emoji Stars) */}
                                  <p>
                                      Average Rating: 
                                      {" " + "⭐".repeat(Math.round(model.averageRating)) + "☆".repeat(5 - Math.round(model.averageRating))}
                                  </p>

                                  <p style={{ color: "red", fontWeight: "bold" }}>SOLD</p>

                                  {/* Rating System (If User Hasn't Rated Yet) */}
                                  {!model.hasRated && account && (
                                      <div>
                                          <div style={{ fontSize: "24px", cursor: "pointer" }}>
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                  <span
                                                      key={star}
                                                      onClick={() => setSelectedRatings({
                                                          ...selectedRatings,
                                                          [model.id]: star
                                                      })}
                                                      style={{
                                                          color: (selectedRatings[model.id] || 0) >= star ? "gold" : "gray"
                                                      }}
                                                  >
                                                      {selectedRatings[model.id] >= star ? "⭐" : "☆"}
                                                  </span>
                                              ))}
                                          </div>
                                          <button onClick={() => rateModel(model.id)} style={{ marginTop: "5px" }}>
                                              Submit Rating
                                          </button>
                                      </div>
                                  )}
                              </div>
                          ))}

                        </div>
                    )}

                    {models.length === 0 && <p>No models available.</p>}
                </div>
            )}
        </div>
    );
};

export default Home;