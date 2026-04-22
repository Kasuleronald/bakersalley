import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const COLORS = {
  indigo: [30, 27, 75],
  amber: [245, 158, 11],
  emerald: [16, 185, 129],
  rose: [225, 29, 72],
  slate: [71, 85, 105],
  ice: [241, 245, 249]
};

const drawHeader = (doc: jsPDF, title: string) => {
  doc.setFillColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BAKERSALLEY 3.1 ARCHITECT', 15, 20);
  doc.setTextColor(COLORS.amber[0], COLORS.amber[1], COLORS.amber[2]);
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 15, 28);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(`VERSION: ENTERPRISE MASTER • ${new Date().toLocaleString()}`, 140, 28);
};

export const generateSystemBlueprintPDF = () => {
  const doc = new jsPDF();

  // 1. PAGE 1: OPERATIONAL FLOW MAP
  drawHeader(doc, 'System Process & Data Flow Topology Map');
  
  let y = 60;
  doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.setFontSize(14);
  doc.text('I. THE OPERATIONAL LIFECYCLE (MAP 1.0)', 15, y);
  
  const processData = [
    ['Phase I', 'Material Supply', 'Supplier Ledger -> Requisition -> LPO -> GRN -> Store Bin'],
    ['Phase II', 'Production Floor', 'Order -> Kanban Board -> Manufacturing Execution (MES) -> FG Intake'],
    ['Phase III', 'Commercial Hub', 'Dispatch -> Outlet Stock -> POS / Invoice -> Treasury'],
    ['Phase IV', 'Audit & Growth', 'PnL -> Ratio Analysis -> Risk Audit -> Strategic ROI']
  ];

  (doc as any).autoTable({
    startY: y + 5,
    head: [['Stage', 'Functional Unit', 'Data Transaction Sequence']],
    body: processData,
    theme: 'grid',
    headStyles: { fillColor: COLORS.indigo },
    styles: { fontSize: 9 }
  });

  y = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('II. INDUSTRIAL KANBAN FLOW (MES LOGIC)', 15, y);
  
  const kanbanData = [
    ['1. Queue', 'Consolidated Demand', 'Active orders pending material release.'],
    ['2. Mixing', 'Hydration Anchor', 'Raw materials converted to dough. First cost-entry point.'],
    ['3. Molding', 'Labor Density', 'Human/Machine shaping. Critical path for unit labor absorption.'],
    ['4. Proofing', 'Thermal Prep', 'Static time-delay node. Risk point for over-proofing waste.'],
    ['5. Baking', 'Oven Bottleneck', 'Primary industrial constraint. Controls total factory throughput.'],
    ['6. Packing', 'Sealing Gate', 'Final QA & Count reconciliation. Moves units to Warehouse bin.']
  ];

  (doc as any).autoTable({
    startY: y + 5,
    head: [['Step', 'Core Focus', 'Operational Governance']],
    body: kanbanData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.slate },
    styles: { fontSize: 8 }
  });

  // 2. PAGE 2: NEURAL HUB & AI DATA ENTRY
  doc.addPage();
  drawHeader(doc, 'Neural Hub & AI Data Entry Architecture');
  
  y = 60;
  doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.setFontSize(14);
  doc.text('III. NEURAL DATA ENTRY ENGINES', 15, y);
  
  const aiData = [
    ['Neural Vision (OCR)', 'Financials/Procure', 'Extracts vendor, date, line-items, and VAT from physical images.'],
    ['Voice Pilot', 'Shift Floor', 'Hands-free production logging via real-time audio stream (Live API).'],
    ['Neural Inbox', 'Accounting', 'Bulk processing of PDFs, CSVs, and Bank Statements into the General Ledger.'],
    ['Synthesis Engine', 'Strategic Growth', 'What-If simulation for S&OP, forecasting material needs for bulk contracts.'],
    ['Anomaly Shield', 'Fraud/Audit', 'Autonomous pattern detection linking material burn to yield throughput.'],
    ['Inventory Nexus', 'Stock Control', 'Neural stock-out prediction based on real production consumption velocity.']
  ];

  (doc as any).autoTable({
    startY: y + 5,
    head: [['Engine', 'Primary Module', 'Operational Logic']],
    body: aiData,
    theme: 'grid',
    headStyles: { fillColor: COLORS.indigo },
    styles: { fontSize: 9 }
  });

  y = (doc as any).lastAutoTable.finalY + 15;
  doc.text('IV. SAGE-COMPATIBLE ACCOUNTING NEXUS', 15, y);
  
  const accountingLogic = [
    ['General Ledger', 'Double-entry integrity with automated debit/credit mapping for all AI entries.'],
    ['Trial Balance', 'Real-time verification of control accounts (Bank, Cash, A/R, A/P, Equity).'],
    ['ECL Provision', 'IFRS 9 compliant aging buckets (0-30, 31-60, 61-90, 91+).'],
    ['ABC Absorption', 'Linking utility burn (Biomass/Electric) directly to unit Manufacturing Margin.'],
    ['DSI Logic', 'Neural monitoring of Finished Goods velocity to minimize warehouse stagnation.']
  ];

  (doc as any).autoTable({
    startY: y + 5,
    body: accountingLogic,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', width: 40, textColor: COLORS.indigo } }
  });

  // 3. PAGE 3: LOGIC & SECURITY
  doc.addPage();
  drawHeader(doc, 'Data Sovereignty & Capital Flow');
  
  y = 60;
  doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.text('V. ZERO-KNOWLEDGE SECURITY MAP', 15, y);
  
  doc.setFillColor(COLORS.ice[0], COLORS.ice[1], COLORS.ice[2]);
  doc.roundedRect(15, y + 5, 180, 45, 3, 3, 'F');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const securityText = "BakersAlley 3.1 utilizes a 'Zero-Knowledge' serverless architecture. SECURITY MAP: Device Entry -> Local AES-256 Encryption -> OAuth2 Tunnel -> Private Google Drive Nexus. No industrial secrets, recipes, or financial records are stored on 3rd party servers. Your private key remains exclusively on this browser's local storage.";
  doc.text(doc.splitTextToSize(securityText, 170), 20, y + 15);

  y = y + 60;
  doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.setFontSize(14);
  doc.text('VI. RECURSIVE REVENUE MAP', 15, y);

  const capFlow = [
    ['Revenue Realization', 'Sales POS / Wholesale Invoicing', 'NSV (Net Sales Value)'],
    ['Direct Cost Trap', 'Material Consumption + Energy Burn', 'COGS Deduction'],
    ['Strategic Drain', '10% Growth Reserve Allocation', 'Locked Fortress Capital'],
    ['Fixed Burn', 'Fixed Salaries + Admin Overheads', 'EBITDA Calculation'],
    ['Net Realization', 'Retained Earnings', 'Balance Sheet Accrual']
  ];

  (doc as any).autoTable({
    startY: y + 5,
    head: [['Segment', 'Transaction Engine', 'Output Result']],
    body: capFlow,
    theme: 'grid',
    headStyles: { fillColor: COLORS.emerald },
    styles: { fontSize: 9 }
  });

  y = (doc as any).lastAutoTable.finalY + 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  doc.setFontSize(7);
  doc.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
  doc.text('This blueprint is a proprietary technical map for the BakersAlley 3.1 Industrial ERP Framework.', 15, y + 5);
  doc.text('Compliance Standards: ISO 9001:2015, IFRS 9 Financial Reporting, UNBS S-Mark Traceability Requirements.', 15, y + 10);

  doc.save('BakersAlley_System_Blueprint_Maps_V3.pdf');
};
