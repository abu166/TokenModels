import React, { useEffect, useState, useCallback } from "react";
import { formatEther, parseEther, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config";

const Home = ({ provider, signer }) => {
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

            if (count === 0) {
                setModels([]);
                setLoading(false);
                return;
            }

            let modelsArray = [];
            for (let i = 1; i <= count; i++) {
                try {
                    const model = await contract.models(i);
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

    const buyModel = async (id, price) => {
        if (!signer) {
            alert("Please connect your wallet.");
            return;
        }
        try {
            const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const tx = await contract.buyModel(id, { value: parseEther(price.toString()) });
            await tx.wait();
            alert("Purchase successful!");
            fetchModels();
        } catch (error) {
            console.error("Purchase failed:", error);
            alert("Transaction failed. See console for details.");
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

            // Remove deleted model from the state
            setModels((prevModels) => prevModels.filter((model) => model.id !== id));
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
                                <p>Price: {model.price} ETH</p>
                                <p>Owner: {model.owner}</p>
                                {!model.purchased ? (
                                    <button onClick={() => buyModel(model.id, model.price)}>Buy</button>
                                ) : (
                                    <p style={{ color: "red" }}>Sold</p>
                                )}

                                {account && model.owner.toLowerCase() === account.toLowerCase() && (
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
