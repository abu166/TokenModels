import React, { useEffect, useState, useCallback } from "react";
import { formatEther, parseUnits, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config";
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button, Form } from "react-bootstrap";
import styles from './Home.module.css';

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


    const renderModelCard = (model, isOwner = false) => (
      <Col key={model.id} lg={4} md={6} className="mb-4">
          <Card className={`${styles.model-Card} h-100`}>
              <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                      <Card.Title className="text-primary">{model.name}</Card.Title>
                      {model.purchased && <Badge className={styles.sold_badge}>SOLD</Badge>}
                      {isOwner && <Badge className={styles.owner_badge}>YOUR MODEL</Badge>}
                  </div>
                  <Card.Text className="text-muted mb-3">{model.description}</Card.Text>
                  
                  <div className="mb-3">
                      <strong>Price:</strong> {model.price} ERC
                      <br />
                      <small className="text-muted">Owner: {isOwner ? 'You' : `${model.owner.slice(0,6)}...${model.owner.slice(-4)}`}</small>
                  </div>

                  {model.purchased && (
                      <div className="mb-3">
                          <strong>Average Rating:</strong>
                          <div className={styles.rating_stars}>
                              {"⭐".repeat(Math.round(model.averageRating))}
                              {"☆".repeat(5 - Math.round(model.averageRating))}
                              <span className="ms-2">({model.averageRating}/5)</span>
                          </div>
                      </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center">
                      {!model.purchased && isOwner && (
                          <Button 
                              variant="danger" 
                              className={styles.btn_danger_custom}
                              onClick={() => deleteModel(model.id)}
                          >
                              Delete
                          </Button>
                      )}

                      {!isOwner && !model.purchased && account && (
                          <Button 
                              className={styles.btn_custom}
                              onClick={() => buyModel(model.id, model.price, model.owner)}
                          >
                              Buy Model
                          </Button>
                      )}

                      {model.purchased && !model.hasRated && account && !isOwner && (
                          <div className="w-100">
                              <Form.Group>
                                  <Form.Label>Rate this model:</Form.Label>
                                  <div className={styles.rating_stars}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                          <span
                                              key={star}
                                              onClick={() => setSelectedRatings({
                                                  ...selectedRatings,
                                                  [model.id]: star
                                              })}
                                              style={{
                                                  color: (selectedRatings[model.id] || 0) >= star ? "gold" : "#ccc",
                                                  marginRight: "5px"
                                              }}
                                          >
                                              ★
                                          </span>
                                      ))}
                                  </div>
                                  <Button
                                      className={`${styles.btn_custom} mt-2`}
                                      onClick={() => rateModel(model.id)}
                                      disabled={!selectedRatings[model.id]}
                                  >
                                      Submit Rating
                                  </Button>
                              </Form.Group>
                          </div>
                      )}
                  </div>
              </Card.Body>
          </Card>
      </Col>
  );

    return (
        <div className={styles.home_container}>
            <Container>
                <h1 className="text-center mb-5" style={{ color: "#3E5C76" }}>AI Model Marketplace</h1>
                
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" className={styles.loading_spinner} />
                        <p className="mt-2">Loading models...</p>
                    </div>
                ) : (
                    <>
                        {yourModels.length > 0 && (
                            <section className="mb-5">
                                <h3 className={styles.section_title}>📌 Your Models</h3>
                                <Row>
                                    {yourModels.map(model => renderModelCard(model, true))}
                                </Row>
                            </section>
                        )}

                        {availableModels.length > 0 && (
                            <section className="mb-5">
                                <h3 className={styles.section_title}>🌍 Available Models</h3>
                                <Row>
                                    {availableModels.map(model => renderModelCard(model))}
                                </Row>
                            </section>
                        )}

                        {soldModels.length > 0 && (
                            <section className="mb-5">
                                <h3 className={styles.section_title}>🔴 Sold Models</h3>
                                <Row>
                                    {soldModels.map(model => renderModelCard(model))}
                                </Row>
                            </section>
                        )}

                        {models.length === 0 && !loading && (
                            <Alert variant="info" className="text-center">
                                No models available in the marketplace.
                            </Alert>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
};

export default Home;