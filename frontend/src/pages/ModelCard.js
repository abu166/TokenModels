// // ModelCard.js
// import React, { useState } from 'react';
// import { formatUnits, parseUnits } from 'ethers';

// export const ModelCard = ({ 
//   model, 
//   onPurchase, 
//   account, 
//   tokenContract, 
//   contract,
//   onRatingSubmit 
// }) => {
//   const [rating, setRating] = useState(0);
//   const [isApproving, setIsApproving] = useState(false);
//   const [isPurchasing, setIsPurchasing] = useState(false);

//   const handlePurchase = async () => {
//     if (!account || !tokenContract || !contract) return;
    
//     try {
//       setIsPurchasing(true);
      
//       // First approve tokens
//       setIsApproving(true);
//       const approveTx = await tokenContract.approve(contract.target, model.price);
//       await approveTx.wait();
//       setIsApproving(false);

//       // Then purchase the model
//       const purchaseTx = await contract.buyModel(model.id);
//       await purchaseTx.wait();
      
//       onPurchase(model.id);
//     } catch (err) {
//       console.error("Purchase failed:", err);
//       alert(err.reason || "Purchase failed");
//     } finally {
//       setIsPurchasing(false);
//       setIsApproving(false);
//     }
//   };

//   const handleRating = async (newRating) => {
//     if (!contract || !account) return;
    
//     try {
//       await onRatingSubmit(model.id, newRating);
//       setRating(newRating);
//     } catch (err) {
//       console.error("Rating failed:", err);
//       alert("Failed to submit rating");
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 mb-4">
//       <h3 className="text-xl font-bold mb-2">{model.name}</h3>
//       <p className="text-gray-600 mb-4">{model.description}</p>
//       <div className="flex justify-between items-center mb-4">
//         <span className="text-lg font-semibold">
//           Price: {formatUnits(model.price, 18)} Tokens
//         </span>
//         <span className="text-sm text-gray-500">
//           Seller: {model.seller.slice(0, 6)}...{model.seller.slice(-4)}
//         </span>
//       </div>
      
//       {/* Rating display */}
//       <div className="mb-4">
//         <div className="flex items-center">
//           {[1, 2, 3, 4, 5].map((star) => (
//             <button
//               key={star}
//               onClick={() => handleRating(star)}
//               disabled={!account || model.isSold}
//               className={`text-2xl ${
//                 star <= (model.rating || rating) 
//                   ? 'text-yellow-500' 
//                   : 'text-gray-300'
//               } focus:outline-none`}
//             >
//               ★
//             </button>
//           ))}
//           {model.rating && (
//             <span className="ml-2 text-sm text-gray-600">
//               ({model.rating}/5)
//             </span>
//           )}
//         </div>
//       </div>

//       <button 
//         onClick={handlePurchase}
//         disabled={!account || model.isSold || isApproving || isPurchasing}
//         className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
//       >
//         {model.isSold 
//           ? "Sold" 
//           : isApproving 
//             ? "Approving Tokens..." 
//             : isPurchasing 
//               ? "Purchasing..." 
//               : "Purchase"
//         }
//       </button>
//     </div>
//   );
// };