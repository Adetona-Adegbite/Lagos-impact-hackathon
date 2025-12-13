import { GoogleGenAI } from "@google/genai";
import { MainInsightsInput, MainInsightsOutput } from "./insight.type.js";
import prisma from "../../config/db.js";

// This is a stub service for AI insights.
// In a real application, this would connect to an ML model or perform complex aggregations.

export const getTopSelling = async () => {
  // Mock data representing top selling items analyzed by AI
  return [
    {
      rank: 1,
      productName: "Fresh Milk 1L",
      category: "Dairy",
      salesVolume: 150,
      revenue: 225.0,
      trend: "stable",
    },
    {
      rank: 2,
      productName: "Whole Wheat Bread",
      category: "Bakery",
      salesVolume: 120,
      revenue: 240.0,
      trend: "up",
    },
    {
      rank: 3,
      productName: "Large Eggs (12pk)",
      category: "Dairy",
      salesVolume: 90,
      revenue: 315.0,
      trend: "down",
    },
  ];
};

export const getLowStockInsights = async () => {
  // AI predictions for stock depletion
  return [
    {
      productName: "Basmati Rice 5kg",
      currentStock: 2,
      predictedDepletion: "2 days",
      suggestion: "Restock 20 units immediately",
      urgency: "high",
    },
    {
      productName: "Sugar 1kg",
      currentStock: 5,
      predictedDepletion: "4 days",
      suggestion: "Restock 50 units",
      urgency: "medium",
    },
  ];
};

export const getTrends = async () => {
  // Mock sales trends analysis
  return {
    summary: "Sales are up 15% compared to last week.",
    dailyTrend: [
      { date: "2023-10-01", sales: 500, footfall: 45 },
      { date: "2023-10-02", sales: 650, footfall: 55 },
      { date: "2023-10-03", sales: 480, footfall: 40 },
      { date: "2023-10-04", sales: 720, footfall: 65 },
      { date: "2023-10-05", sales: 600, footfall: 50 },
    ],
    topCategory: "Dairy",
  };
};

export const getRecommendations = async () => {
  // AI generated actionable insights
  return [
    {
      id: "rec_1",
      type: "pricing",
      title: "Optimize Pricing",
      message:
        'Consider lowering the price of "Premium Coffee" by 5% to boost sales volume.',
      potentialImpact: "+10% revenue",
    },
    {
      id: "rec_2",
      type: "inventory",
      title: "Seasonal Demand",
      message:
        'Stock up on "Cold Drinks" before the forecasted weekend heatwave.',
      potentialImpact: "Avoid stockouts",
    },
    {
      id: "rec_3",
      type: "merchandising",
      title: "Bundle Opportunity",
      message:
        'Customers who buy "Bread" often buy "Butter". Create a breakfast bundle.',
      potentialImpact: "Increase average basket size",
    },
  ];
};

export const generateMainInsights = async (
  language = "en",
): Promise<MainInsightsOutput> => {
  // 1. DATA FETCHING
  const now = new Date();
  const sixtyDaysAgo = new Date(new Date().setDate(now.getDate() - 60));
  const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));

  const [sales, allProducts] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: sixtyDaysAgo } },
      include: { items: { include: { product: true } } },
    }),
    prisma.product.findMany({ include: { inventory: true } }),
  ]);

  // 2. DATA PROCESSING
  // Performance Overview
  const currentPeriodSales = sales.filter(
    (s) => new Date(s.createdAt) >= thirtyDaysAgo,
  );
  const comparisonPeriodSales = sales.filter(
    (s) => new Date(s.createdAt) < thirtyDaysAgo,
  );

  const currentRevenue = currentPeriodSales.reduce(
    (sum, s) => sum + s.totalAmount,
    0,
  );
  const comparisonRevenue = comparisonPeriodSales.reduce(
    (sum, s) => sum + s.totalAmount,
    0,
  );

  const revenueChangePercent =
    comparisonRevenue > 0
      ? ((currentRevenue - comparisonRevenue) / comparisonRevenue) * 100
      : currentRevenue > 0
        ? 100
        : 0;

  const getTrend = (current: number, comparison: number) => {
    if (current > comparison * 1.05) return "upward"; // 5% threshold
    if (current < comparison * 0.95) return "downward";
    return "stable";
  };

  const revenue_trend = getTrend(currentRevenue, comparisonRevenue);
  const transaction_trend = getTrend(
    currentPeriodSales.length,
    comparisonPeriodSales.length,
  );
  const currentAOV =
    currentPeriodSales.length > 0
      ? currentRevenue / currentPeriodSales.length
      : 0;
  const comparisonAOV =
    comparisonPeriodSales.length > 0
      ? comparisonRevenue / comparisonPeriodSales.length
      : 0;
  const average_order_value_trend = getTrend(currentAOV, comparisonAOV);

  // Product Insights & Inventory
  const productSales = new Map<
    string,
    { quantity: number; revenue: number; name: string }
  >();
  currentPeriodSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSales.get(item.productId) || {
        quantity: 0,
        revenue: 0,
        name: item.product.name,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.quantity * item.priceAtSale;
      productSales.set(item.productId, existing);
    });
  });

  const productPerformance = Array.from(productSales.entries()).map(
    ([productId, data]) => ({
      productId,
      name: data.name,
      totalQuantity: data.quantity,
      totalRevenue: data.revenue,
      daily_avg_units: data.quantity / 30, // 30-day window
    }),
  );
  productPerformance.sort((a, b) => b.totalQuantity - a.totalQuantity);

  const fast_moving = productPerformance
    .slice(0, 3)
    .map((p) => ({ name: p.name, daily_avg_units: p.daily_avg_units }));

  const soldProductIds = new Set(productSales.keys());
  const slow_moving = allProducts
    .filter(
      (p) =>
        !soldProductIds.has(p.id) && p.inventory && p.inventory.quantity > 0,
    )
    .slice(0, 3)
    .map((p) => ({ name: p.name, days_no_sale: 30 })); // Approximation

  const expected_stockouts: { product: string; estimated_days_left: number }[] =
    [];
  const overstocked: { product: string; days_of_stock_left: number }[] = [];

  allProducts.forEach((p) => {
    const perf = productPerformance.find((pp) => pp.productId === p.id);
    const inventory = p.inventory?.quantity || 0;
    if (perf && perf.daily_avg_units > 0 && inventory > 0) {
      const days_left = inventory / perf.daily_avg_units;
      if (days_left <= 7) {
        expected_stockouts.push({
          product: p.name,
          estimated_days_left: Math.floor(days_left),
        });
      }
      if (days_left > 90) {
        overstocked.push({
          product: p.name,
          days_of_stock_left: Math.floor(days_left),
        });
      }
    }
  });

  // Sales Patterns
  const salesByHour = new Array(24).fill(0);
  const salesByDay = new Array(7).fill(0);
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  currentPeriodSales.forEach((sale) => {
    const date = new Date(sale.createdAt);
    salesByHour[date.getHours()] += sale.totalAmount;
    salesByDay[date.getDay()] += sale.totalAmount;
  });

  const peak_hour_start = salesByHour.indexOf(Math.max(...salesByHour));
  const peak_hours = `${peak_hour_start}:00 - ${peak_hour_start + 1}:00`;

  const sortedDays = salesByDay
    .map((amount, index) => ({ amount, index }))
    .sort((a, b) => b.amount - a.amount);
  const best_days = sortedDays.slice(0, 2).map((d) => dayNames[d.index]);
  const low_activity_periods = sortedDays
    .slice(-2)
    .map((d) => dayNames[d.index]);

  // Risk Signals
  const missed_sales_due_to_stockout = allProducts.some(
    (p) => (p.inventory?.quantity || 0) === 0 && soldProductIds.has(p.id),
  );
  const top3ProductsRevenue = productPerformance
    .slice(0, 3)
    .reduce((sum, p) => sum + p.totalRevenue, 0);
  const revenue_dependency_on_top_3_products_percent =
    currentRevenue > 0 ? (top3ProductsRevenue / currentRevenue) * 100 : 0;

  // 3. ASSEMBLE AI INPUT
  const data: MainInsightsInput = {
    store: {
      name: "SupaMart (auto-generated)",
      days_in_operation: 180,
      store_type: "Groceries",
    },
    analysis_window: {
      current_period: "Last 30 Days",
      comparison_period: "Previous 30 Days",
    },
    performance_overview: {
      revenue_trend,
      revenue_change_percent: parseFloat(revenueChangePercent.toFixed(2)),
      transaction_trend,
      average_order_value_trend,
    },
    product_insights: {
      fast_moving,
      slow_moving,
    },
    inventory_forecast: {
      expected_stockouts,
      overstocked,
    },
    sales_patterns: {
      peak_hours,
      best_days,
      low_activity_periods,
    },
    risk_signals: {
      missed_sales_due_to_stockout,
      revenue_dependency_on_top_3_products_percent: parseFloat(
        revenue_dependency_on_top_3_products_percent.toFixed(2),
      ),
    },
  };

  // 4. CALL AI
  if (!process.env.GEMINI_API_KEY) {
    return {
      business_direction:
        "AI insights are not available. Please configure the Gemini API Key.",
      key_insights: [],
      near_term_prediction: "",
      risk_alerts: [],
      recommended_actions: [],
      closing_note: "",
    };
  }

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const languageMap: { [key: string]: string } = {
    en: "English",
    pcm: "Nigerian Pidgin",
    hausa: "Hausa",
    yoruba: "Yoruba",
    igbo: "Igbo",
  };
  const targetLanguage = languageMap[language] || "English";

  const prompt = `
    You are an expert business analyst for a small retail store. Your task is to generate a comprehensive business insight report based on the JSON data provided. Analyze all aspects of the data and provide clear, actionable insights in ${targetLanguage}.

    **Business Context:**
    - Store Name: ${data.store.name}
    - Store Type: ${data.store.store_type}
    - Days in Operation: ${data.store.days_in_operation}
    - Analysis Period: Comparing ${data.analysis_window.current_period} with ${data.analysis_window.comparison_period}.

    **Raw Data for Analysis:**
    \`\`\`json
    ${JSON.stringify(data, null, 2)}
    \`\`\`

    **Your Task:**
    Generate a JSON object with the following structure. ALL string values in the JSON output MUST be in ${targetLanguage}.

    \`\`\`json
    {
      "business_direction": "A high-level summary (2-3 sentences) of the business's overall health and trajectory. Is it growing, stable, or facing challenges?",
      "key_insights": [
        "A bullet point list of 3-4 of the most critical findings from the data. Each insight should be a concise sentence. Example: 'Revenue is up by ${data.performance_overview.revenue_change_percent}%, driven by higher transaction volume.'",
        "Another key insight. Example: 'Product X is selling twice as fast as the average product, driving most of the recent growth.'",
        "A third key insight. Example: 'Sales are strongest during weekend evenings, peaking around ${data.sales_patterns.peak_hours}.'"
      ],
      "near_term_prediction": "A 1-2 sentence forecast for the next 1-2 weeks. What is likely to happen based on current trends? Example: 'Expect continued sales growth, but watch out for a potential stockout of Product Y within ${data.inventory_forecast.expected_stockouts[0]?.estimated_days_left || "a few"} days.'",
      "risk_alerts": [
        "A bullet point list of 1-3 urgent risks or problems that need immediate attention. If there are no risks, return an empty array []. Example: 'High revenue dependency (${data.risk_signals.revenue_dependency_on_top_3_products_percent}%) on just three products poses a significant risk.'",
        "Another risk alert. Example: 'Product Z has not sold in ${data.product_insights.slow_moving[0]?.days_no_sale || "many"} days and is tying up capital.'"
      ],
      "recommended_actions": [
        "A bullet point list of 2-3 clear, actionable recommendations. What should the business owner do next? Example: 'Immediately reorder products expected to stock out, starting with Product Y.'",
        "Another recommendation. Example: 'Run a promotion (e.g., 'Buy One, Get One 50% off') on slow-moving items like Product Z to clear inventory.'",
        "A third recommendation. Example: 'Increase staff or run a special offer during peak hours (${data.sales_patterns.peak_hours}) to maximize revenue.'"
      ],
      "closing_note": "A brief, encouraging closing remark (1 sentence). Example: 'The business is showing positive signs of growth; keep up the great work!'"
    }
    \`\`\`

    IMPORTANT: Respond with ONLY the valid JSON object. Do not include any explanatory text or markdown formatting like \`\`\`json.
  `;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const text = result.text || "{}";
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Main Insight Error:", error);
    // Fallback in case of AI error
    return {
      business_direction: "Could not generate AI insights at this moment.",
      key_insights: [
        "There was an error communicating with the analysis engine.",
      ],
      near_term_prediction: "Unable to provide a forecast.",
      risk_alerts: [],
      recommended_actions: ["Please check your connection or try again later."],
      closing_note: "We apologize for the inconvenience.",
    };
  }
};
