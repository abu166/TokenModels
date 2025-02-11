import React, { useEffect, useState, useCallback } from "react";
import { formatEther, parseUnits, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config";

const Home = ({ provider, signer, tokenContract }) => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState(null);

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
                    
                    // Ensure model is valid and has not been deleted
                    if (model.exists && model.seller !== "0x0000000000000000000000000000000000000000") {
                        modelsArray.push({
                            id: i,
                            name: model.name,
                            description: model.description,
                            price: formatEther(model.price),
                            owner: model.seller,
                            purchased: model.isSold,
                        });
                    }
                } catch (error) {
                    console.warn(`Skipping deleted model with ID ${i}`);
                }
            }
            setModels(modelsArray);
        } catch (error) {
            console.error("Error fetching models:", error);
            setModels([]);
        } finally {
            setLoading(false);
        }
    }, [provider]);

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

            // Check user's balance
            const userBalance = await tokenContract.balanceOf(account);
            if (userBalance < priceInWei) {
                alert("Insufficient ERC-20 token balance.");
                return;
            }

            // Approve marketplace contract to spend tokens
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, priceInWei);
            await approveTx.wait();

            // Execute purchase
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
            console.log("Deleting model with ID:", id);

            const tx = await contract.deleteModel(id);
            await tx.wait();
            alert("Model deleted successfully!");

            // Refresh model list after deletion
            fetchModels();
        } catch (error) {
            console.error("Deletion failed:", error);
            alert("Transaction failed. See console for details.");
        }
    };

    return (
        <div>
            <h1>AI Model Marketplace</h1>
            {loading ? (
                <p>Loading models...</p>
            ) : (
                <div>
                    {models.length > 0 ? (
                        models.map((model) => (
                            <div key={model.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
                                <h2>{model.name}</h2>
                                <p>{model.description}</p>
                                <p>Price: {model.price} ERC-20</p>
                                <p>Owner: {model.owner}</p>

                                {/* Buy Button (only if the user is not the owner and the model is not sold) */}
                                {!model.purchased && account && model.owner.toLowerCase() !== account.toLowerCase() && (
                                    <button onClick={() => buyModel(model.id, model.price, model.owner)}>Buy</button>
                                )}

                                {/* Sold Indicator */}
                                {model.purchased && <p style={{ color: "red" }}>Sold</p>}

                                {/* Delete Button (only if the user is the owner AND the model is not sold) */}
                                {account && 
                                    model.owner.toLowerCase() === account.toLowerCase() && 
                                    !model.purchased && (
                                        <button 
                                            onClick={() => deleteModel(model.id)} 
                                            style={{ marginLeft: "10px", background: "red", color: "white" }}
                                        >
                                            Delete
                                        </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No models available.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;
