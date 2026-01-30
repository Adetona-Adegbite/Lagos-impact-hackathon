interface MainInsightsInput {
  store: {
    name: string;
    days_in_operation: number;
    store_type: string;
  };
  analysis_window: {
    current_period: string;
    comparison_period: string;
  };
  performance_overview: {
    revenue_trend: "upward" | "stable" | "downward";
    revenue_change_percent: number;
    transaction_trend: string;
    average_order_value_trend: string;
  };
  product_insights: {
    fast_moving: { name: string; daily_avg_units: number }[];
    slow_moving: { name: string; days_no_sale: number }[];
  };
  inventory_forecast: {
    expected_stockouts: { product: string; estimated_days_left: number }[];
    overstocked: { product: string; days_of_stock_left: number }[];
  };
  sales_patterns: {
    peak_hours: string;
    best_days: string[];
    low_activity_periods: string[];
  };
  risk_signals: {
    missed_sales_due_to_stockout: boolean;
    revenue_dependency_on_top_3_products_percent: number;
  };
}

interface MainInsightsOutput {
  business_direction: string;
  key_insights: string[];
  near_term_prediction: string;
  risk_alerts: string[];
  recommended_actions: string[];
  closing_note: string;
}

export type { MainInsightsInput, MainInsightsOutput };
