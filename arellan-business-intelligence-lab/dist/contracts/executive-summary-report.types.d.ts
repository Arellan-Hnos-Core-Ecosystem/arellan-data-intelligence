import type { MechanicCycleTimeReport } from "./mechanic-performance.types";
import type { QuoteConversionReport, CashMarginReport } from "./financial-health.types";
import type { InventoryValuationReport } from "./inventory-valuation.types";
export interface ExecutiveSummaryReport {
    cycleTime: MechanicCycleTimeReport;
    quoteConversion: QuoteConversionReport;
    inventoryValuation: InventoryValuationReport;
    cashMargin: CashMarginReport;
    generatedAt: string;
    cached: boolean;
}
