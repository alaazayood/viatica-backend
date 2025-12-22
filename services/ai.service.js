const Order = require('../models/Order');

module.exports.getDrugDemand = async (drugId) => {
  const stats = await Order.aggregate([
    { $unwind: '$drugs' },
    { $match: { 'drugs.drug': typeof drugId === 'string' ? require('mongoose').Types.ObjectId(drugId) : drugId } },
    { $group: { _id: '$drugs.drug', totalQuantity: { $sum: '$drugs.quantity' } } }
  ]);
  return stats[0]?.totalQuantity || 0;
};

module.exports.analyzeDrugData = async (drug) => {
  // Placeholder for AI analysis logic
  // In the future, this could connect to an external AI service to check for interactions or predict demand
  console.log(`🤖 AI Analysis started for drug: ${drug.name}`);
  return { 
    status: 'completed', 
    prediction: 'stable_demand',
    notes: 'Analysis placeholder' 
  };
};
