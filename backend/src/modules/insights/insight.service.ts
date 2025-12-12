// This is a stub service for AI insights.
// In a real application, this would connect to an ML model or perform complex aggregations.

export const getTopSelling = async () => {
  // Mock data representing top selling items analyzed by AI
  return [
    {
      rank: 1,
      productName: 'Fresh Milk 1L',
      category: 'Dairy',
      salesVolume: 150,
      revenue: 225.0,
      trend: 'stable',
    },
    {
      rank: 2,
      productName: 'Whole Wheat Bread',
      category: 'Bakery',
      salesVolume: 120,
      revenue: 240.0,
      trend: 'up',
    },
    {
      rank: 3,
      productName: 'Large Eggs (12pk)',
      category: 'Dairy',
      salesVolume: 90,
      revenue: 315.0,
      trend: 'down',
    },
  ];
};

export const getLowStockInsights = async () => {
  // AI predictions for stock depletion
  return [
    {
      productName: 'Basmati Rice 5kg',
      currentStock: 2,
      predictedDepletion: '2 days',
      suggestion: 'Restock 20 units immediately',
      urgency: 'high',
    },
    {
      productName: 'Sugar 1kg',
      currentStock: 5,
      predictedDepletion: '4 days',
      suggestion: 'Restock 50 units',
      urgency: 'medium',
    },
  ];
};

export const getTrends = async () => {
  // Mock sales trends analysis
  return {
    summary: 'Sales are up 15% compared to last week.',
    dailyTrend: [
      { date: '2023-10-01', sales: 500, footfall: 45 },
      { date: '2023-10-02', sales: 650, footfall: 55 },
      { date: '2023-10-03', sales: 480, footfall: 40 },
      { date: '2023-10-04', sales: 720, footfall: 65 },
      { date: '2023-10-05', sales: 600, footfall: 50 },
    ],
    topCategory: 'Dairy',
  };
};

export const getRecommendations = async () => {
  // AI generated actionable insights
  return [
    {
      id: 'rec_1',
      type: 'pricing',
      title: 'Optimize Pricing',
      message: 'Consider lowering the price of "Premium Coffee" by 5% to boost sales volume.',
      potentialImpact: '+10% revenue',
    },
    {
      id: 'rec_2',
      type: 'inventory',
      title: 'Seasonal Demand',
      message: 'Stock up on "Cold Drinks" before the forecasted weekend heatwave.',
      potentialImpact: 'Avoid stockouts',
    },
    {
      id: 'rec_3',
      type: 'merchandising',
      title: 'Bundle Opportunity',
      message: 'Customers who buy "Bread" often buy "Butter". Create a breakfast bundle.',
      potentialImpact: 'Increase average basket size',
    },
  ];
};
