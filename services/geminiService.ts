
import { GoogleGenAI } from "@google/genai";
import { SKU, Ingredient, Activity, MonthlyForecast, Asset, Transaction, Loan, Employee, SupplierInvoice, Sale, AppraisalRecord, Goal, Order, ProductionLog, InventoryLoss, Requisition, Supplier, Lead, TaxConfig, QALog, IndustryProfile, QCParameterSpec, LegalClause, IndustryTerminology, MarketOpportunity, Customer, OptimizationReport, PredictiveMaintenanceReport, SourcingResilienceReport, WeighbridgeTicket, ForecastScenario, ScheduledTask, WorkCenterResource, SalesAgent, Outlet, ReturnLog } from "../types";

/**
 * Executes a function with exponential backoff retry logic for AI calls.
 */
const executeWithRetry = async <T>(fn: (ai: GoogleGenAI) => Promise<T>, maxRetries = 3, initialDelay = 1500): Promise<T | null> => {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return await fn(ai);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const isRetryable = errorMsg.includes("503") || errorMsg.includes("429") || errorMsg.includes("overloaded") || errorMsg.includes("rate limit");
      
      if (errorMsg.includes("Requested entity was not found")) {
        if (window.aistudio) {
          window.aistudio.openSelectKey();
        }
        return null;
      }

      if (isRetryable && attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      break; 
    }
  }
  return null;
};

/**
 * Industrial Floor Productivity Audit: Identifies bottlenecks and loss points.
 */
export const analyzeFloorProductivity = async (params: {
  logs: ProductionLog[];
  assets: Asset[];
  orders: Order[];
  employees: Employee[];
}): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as an Industrial Engineering Consultant for a large-scale commercial bakery.
      PRODUCTION LOGS (RECENT): ${JSON.stringify(params.logs.slice(-20))}
      ASSETS (MACHINERY): ${JSON.stringify(params.assets)}
      LABOR ROSTER: ${JSON.stringify(params.employees.map(e => ({ name: e.name, role: e.role, assignments: e.assignments })))}
      
      TASK: Perform a productivity and loss audit.
      1. WORKFLOW OPTIMIZATION: Suggest a sequence of bakes that maximizes thermal mass and minimizes oven idle time.
      2. LOSS MINIMIZATION: Identify yield variances and suggest floor SOP changes to reduce scrap.
      3. RESOURCE ALLOCATION: Suggest staff assignments based on SKU complexity.
      
      Return a strictly valid JSON object:
      {
        "productivityDirectives": [{ "title": "string", "impact": "High" | "Medium", "action": "string" }],
        "lossPreventionTactics": [{ "title": "string", "logic": "string" }],
        "resourceOptimizations": ["string"],
        "bottleneckDiagnosis": "string",
        "projectedMarginGain": "string (e.g. +14%)"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{}');
  });
};

/**
 * Historical Cash Flow Audit: Performs CFO-level analysis on 6 months of data.
 */
export const analyzeHistoricalCashFlow = async (params: {
  monthlyData: any[];
  currentNet: number;
  unpaidInvoicesValue: number;
  receivablesValue: number;
}): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as a CFO and Industrial Financial Auditor for a commercial bakery.
      6-MONTH DATA TREND: ${JSON.stringify(params.monthlyData)}
      CURRENT NET CASH: ${params.currentNet}
      A/P (LIABILITY): ${params.unpaidInvoicesValue}
      A/R (RECEIVABLES): ${params.receivablesValue}

      TASK:
      1. IDENTIFY KEY DRIVERS: What is the primary source of inflows (e.g., Seasonal Sales, Equity) and outflows (e.g., Raw Material spikes, OpEx burn)?
      2. WORKING CAPITAL OPTIMIZATION: Suggest 3 specific tactical improvements (e.g., "Negotiate 15-day extension with flour supplier", "Incentivize bulk pre-payments").
      3. LIQUIDITY VERDICT: Is the business generating enough cash to cover its fixed burn?

      Return a strictly valid JSON object:
      {
        "inflowDrivers": ["string"],
        "outflowDrivers": ["string"],
        "capitalOptimizations": [
          { "action": "string", "impact": "High" | "Medium", "logic": "string" }
        ],
        "executiveVerdict": "3-4 sentence financial summary",
        "healthScore": number (0-100)
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{}');
  });
};

/**
 * Enhanced for Foodforecast-style sustainability focus: Predict demand with a Lean bias.
 */
export const predictOutletDemand = async (name: string, type: string, history: Sale[], skus: SKU[]): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as a Sustainability-Focused Bakery Demand Forecaster.
      OUTLET: ${name} (${type})
      HISTORICAL VELOCITY: ${JSON.stringify(history.slice(0, 50))}
      
      TASK: Predict tomorrow's demand with a core objective of MINIMIZING WASTE (Lean Production). 
      Error on the side of caution (slight under-prediction) to ensure 100% freshness and 0% stales. 
      Identify which items are most prone to over-baking waste.
      
      Return JSON: [{ "skuId": "string", "predictedQty": number, "confidence": number, "wasteRiskAlert": "string" }]
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  });
};

/**
 * Ledger Forensic Audit: Detects outliers, duplicate entries, and potential fraud patterns.
 */
export const performLedgerForensicAudit = async (params: {
  transactions: Transaction[];
  sales: Sale[];
  skus: SKU[];
  intent?: string;
}): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as a Senior Forensic Management Accountant specialized in industrial manufacturing.
      DATA CONTEXT:
      - Transaction Ledger: ${JSON.stringify(params.transactions.slice(0, 100))}
      - Sales Volume: ${params.sales.length} records.
      
      USER AUDIT INTENT: "${params.intent || 'Perform institutional integrity scan'}"
      
      TASK:
      1. DETECT FRAUD SIGNATURES: Look for round-number recurring payments (ghost vendors), duplicate amounts with slightly different dates (double-invoicing), or unusual cash drains.
      2. ANALYZE PRICE DRIFTS: Flag if SKU sales prices in the ledger deviate from the master catalog targets.
      3. MATERIAL/YIELD IMBALANCE: Correlate energy/fuel spend with production volume. Flag spikes that don't match output.
      
      Return a strictly valid JSON object:
      {
        "integrityScore": number (0-100),
        "anomalies": [
          { "id": "string", "type": "Ghost Expense" | "Price Drift" | "Double Invoice" | "Leakage", "severity": "High" | "Medium", "description": "string", "remedy": "string" }
        ],
        "verdict": "3 sentence institutional forensic summary for the Board."
      }
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || '{}');
  });
};

/**
 * Revenue Forensic Audit: Identifying leakage and assuring realization.
 */
export const performRevenueForensicAudit = async (params: {
  sales: Sale[];
  transactions: Transaction[];
  orders: Order[];
  customers: Customer[];
  intent?: string;
}): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as a Revenue Assurance Forensic Auditor.
      DATA CONTEXT:
      - Sales Volume: ${params.sales.length} transactions.
      - Recognized Revenue: ${params.orders.reduce((s, o) => s + o.totalPrice, 0)} (via Invoices).
      - Realized Cash: ${params.transactions.filter(t => t.type === 'Credit' && t.category === 'Sale').reduce((s, t) => s + t.amount, 0)}.
      
      USER STRATEGIC INTENT: "${params.intent || 'Detect leakage between sales records and bank realizations'}"
      
      TASK:
      1. Calculate the "Realization Gap" (Invoiced vs. Paid).
      2. Identify high-risk "Taxpayer-Style" profiles (Partners with poor credit behavior).
      3. Recommend Revenue Protection measures.
      
      Return a strictly valid JSON object:
      {
        "realizationScore": number (0-100),
        "leakageDetected": "string",
        "highRiskPartners": ["string"],
        "protectionMeasures": [
          { "title": "string", "impact": "High" | "Medium", "description": "string" }
        ],
        "auditVerdict": "3 sentence forensic summary"
      }
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || '{}');
  });
};

/**
 * Commercial Productivity Audit: Analyzes sales velocity and returns leakage.
 */
export const analyzeSalesProductivity = async (params: {
  sales: Sale[];
  skus: SKU[];
  agents: SalesAgent[];
  outlets: Outlet[];
  returns: ReturnLog[];
  intent?: string;
}): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as a Commercial Strategy Director.
      DATA CONTEXT:
      - Sales History: ${params.sales.length} records.
      - Returns/Stales: ${params.returns.length} logs.
      
      USER STRATEGIC INTENT: "${params.intent || 'Maximize Net Realization and minimize spoilage'}"
      
      TASK:
      1. Identify the 'Loss Hotspot' (Which route or product has the highest returns-to-sales ratio).
      2. Analyze Agent Productivity.
      3. Recommend Workflow Optimizations.
      
      Return a strictly valid JSON object:
      {
        "productivityScore": number (0-100),
        "primaryLossDriver": "string",
        "leakageAnalysis": "string",
        "recommendations": [
          { "category": "Workflow" | "Resources" | "Pricing", "action": "string", "impact": "High" | "Medium" | "Low" }
        ],
        "strategyNarrative": "3 sentence strategic summary"
      }
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || '{}');
  });
};

/**
 * Grounded Market Intelligence: Fetches live pricing and sentiment data for benchmarking.
 */
export const getMarketIntelligence = async (region: string, nation: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Search for real-time market data for the bakery and pastry industry in ${region}, ${nation}.
      Focus on:
      1. Competitive retail pricing for standard white bread (800g), custom cakes, and croissants.
      2. Current consumer sentiment towards healthy/artisanal options.
      
      Return a strictly valid JSON object:
      {
        "pricing": [{ "item": "string", "averagePrice": number, "competitorRange": "string", "competitorNotes": "string" }],
        "sentiment": { "score": number, "summary": "string", "topTrends": ["string"] },
        "landscape": "string"
      }
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: { 
        tools: [{googleSearch: {}}]
      }
    });
    
    const text = response.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
    
    return { ...data, groundingUrls: urls };
  });
};

export const generateGanttSchedule = async (orders: Order[], skus: SKU[], resources: WorkCenterResource[], userIntent?: string): Promise<ScheduledTask[] | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as an Industrial Production Engineer.
      Generate a 24-hour visual production sequence for a bakery.
      Return strictly valid JSON array of ScheduledTask objects.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]') as ScheduledTask[];
  });
};

export const generateExecutiveBoardBrief = async (context: {
  financials: any;
  riskProfile: any;
  complianceScore: number;
  nsvGrowth: number;
}, userIntent?: string): Promise<string | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as the Chief Strategy Officer reporting to a Board.
      Draft a 3-paragraph executive brief based on: ${JSON.stringify(context)}
    `;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || null;
  });
};

export const analyzeRiskProfile = async (data: any, userIntent?: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Analyze manufacturing resilience. DATA: ${JSON.stringify(data)}`;
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: prompt, 
      config: { responseMimeType: "application/json" } 
    });
    return JSON.parse(response.text || '{}');
  });
};

export const runSourcingResilienceAudit = async (ingredients: Ingredient[], suppliers: Supplier[], userIntent?: string): Promise<SourcingResilienceReport | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `
      Act as an Industrial Supply Chain Resiliency Auditor. 
      Contrast the provided data against "Kitchen-scale" procurement to identify industrial single-vendor risks.
      
      DATA: 
      Ingredients: ${JSON.stringify(ingredients.map(i => i.name))}
      Suppliers: ${JSON.stringify(suppliers.map(s => ({ name: s.name, rating: s.rating })))}
      
      Perform sourcing resilience audit. Return strictly JSON:
      {
        "criticalShortfalls": [{ "ingredientName": "string", "riskLevel": "Critical" | "Standard", "alternativeSuppliersNeeded": number }],
        "diversificationScore": number (0-100)
      }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}') as SourcingResilienceReport;
  });
};

export const analyzeProductMix = async (data: any[], userIntent?: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Analyze BCG Matrix product mix. DATA: ${JSON.stringify(data)}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateMarketingStrategy = async (skus: SKU[], sales: Sale[], budget: number, strategy: string, userIntent?: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Generate a marketing execution plan. Return strictly JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeCompetitiveStrategy = async (intent: string, skuMetrics: any[], totalFixed: number, userIntent?: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Audit Porter's Generic Strategy. Return strictly JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generatePersonnelFeedback = async (employee: Employee, appraisal: AppraisalRecord, goals: Goal[], userIntent?: string): Promise<string | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Draft HR coaching feedback for ${employee.name}.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || null;
  });
};

export const analyzeSnOP = async (skus: SKU[], forecasts: MonthlyForecast[], totals: any, userIntent?: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Sales & Operations Equilibrium Audit. Return strictly JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeProcurement = async (req: Requisition, ing: Ingredient, supp?: Supplier, userIntent?: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Audit procurement requisition. Return strictly JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeSustainability = async (logs: ProductionLog[], losses: InventoryLoss[], skus: SKU[], userIntent?: string): Promise<string | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Industrial ESG and Sustainability audit.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || null;
  });
};

export const getIngredientScientificBrief = async (ingredientName: string): Promise<string | null> => {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Scientific brief for: ${ingredientName}.`
    });
    return response.text || null;
  });
};

export const optimizeProductionSequence = async (orders: Order[], skus: SKU[], assets: Asset[], employees: Employee[]): Promise<OptimizationReport | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Optimize production sequence. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}') as OptimizationReport;
  });
};

export const generateCustomerGrowthStrategy = async (customer: Customer, history: Sale[], skus: SKU[]): Promise<{ strategy: string, followUp: string } | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Generate customer growth strategy for ${customer.name}. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const runPredictiveMaintenanceAudit = async (asset: Asset, logs: ProductionLog[]): Promise<PredictiveMaintenanceReport | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Predictive maintenance audit for asset. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}') as PredictiveMaintenanceReport;
  });
};

export const analyzeQualityFailure = async (log: QALog, sku: SKU): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Analyze quality failure. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const getTrendingBakeryInsights = async (query: string, location: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: `Search for trending bakery insights for "${query}" in ${location}.`,
      config: { tools: [{googleSearch: {}}] }
    });
    const text = response.text || "";
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
    return { suggestions: [text], urls };
  });
};

export const optimizeInventoryProcurement = async (requirements: any[], ingredients: Ingredient[]): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Optimize inventory procurement. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeOpportunityScore = async (lead: Lead): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Analyze sales opportunity. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateCashStrategy = async (metrics: any, orders: Order[], invoices: SupplierInvoice[]): Promise<string | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Generate cash flow strategy.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    return response.text || null;
  });
};

export const analyzeTaxPosition = async (stats: any, config: TaxConfig): Promise<string | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Analyze tax position.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    return response.text || null;
  });
};

export const analyzeDocumentImage = async (base64: string, docType: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Extract data from this ${docType} image. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64.split(',')[1] } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateIndustryBlueprint = async (description: string, nation: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Generate industry blueprint. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const findLocalBakeryLeads = async (location: string, nation: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: `B2B bakery leads in ${location}, ${nation}.`,
      config: { tools: [{googleSearch: {}}] }
    });
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
    let text = response.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    try {
      const data = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
      return { ...data, groundingUrls: urls };
    } catch (e) {
      return { opportunities: [], groundingUrls: urls };
    }
  });
};

export const scanLocalConsumerDemand = async (location: string, nation: string, items: string[]): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: `Consumer demand in ${location}, ${nation}.`,
      config: { tools: [{googleSearch: {}}] }
    });
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
    let text = response.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    try {
      const data = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
      return { ...data, groundingUrls: urls };
    } catch (e) {
      return { opportunities: [], groundingUrls: urls };
    }
  });
};

export const getTroubleshootingAdvice = async (defectDescription: string, skuName: string): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Troubleshooting for ${skuName}: "${defectDescription}".`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeWeighbridgeIntegrity = async (tickets: WeighbridgeTicket[], ingredients: Ingredient[], skus: SKU[]): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    const prompt = `Weighbridge audit. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const processSmartBookkeeping = async (params: { text?: string, base64?: string, mimeType?: string }): Promise<any | null> => {
  return executeWithRetry(async (ai) => {
    let contents: any;
    if (params.base64) {
        contents = {
            parts: [
                { inlineData: { mimeType: params.mimeType || 'image/jpeg', data: params.base64.split(',')[1] || params.base64 } },
                { text: "Extract entries. Return JSON." }
            ]
        };
    } else {
        contents = `Extract entries: ${params.text}. Return JSON.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};
