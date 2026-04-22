
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SKU, Ingredient, Activity, Order, Customer, Payment, Supplier, RMQALog, Employee, Sale, Transaction, Outlet, Requisition, InventoryMovement, ProductionLog, QALog, DailyOutletForecast, BusinessProfile } from '../types';
import { TERMS_AND_CONDITIONS } from '../constants';

export const generateDeploymentPlanPDF = (clientName: string, steps: any[]) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleDateString();

  // Branding Header
  doc.setFillColor(30, 27, 75); // Indigo 950
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SYSTEM DEPLOYMENT ROADMAP', 15, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.text(`PREPARED FOR: ${clientName.toUpperCase()}`, 15, 35);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`GENERATED VIA BAKERSALLEY INTELLIGENCE • ${timestamp}`, 15, 42);

  let y = 65;
  doc.setTextColor(30, 27, 75);
  doc.setFontSize(14);
  doc.text('Implementation Phases & Milestones', 15, y);

  const body = steps.map((s, i) => [
    `PHASE ${i + 1}`,
    s.phase,
    s.task,
    s.importance
  ]);

  (doc as any).autoTable({
    startY: y + 8,
    head: [['Ref', 'Category', 'Strategic Task', 'Criticality']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [30, 27, 75], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 20 },
      1: { fontStyle: 'bold', width: 35 },
      3: { fontStyle: 'bold', width: 25 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.setTextColor(100);
  const note = "Note: This deployment plan is a technical guide for transitioning a manual bakery to the BakersAlley 3.1 Industrial Ledger. Completion of Phase 5 (Go-Live) constitutes the official record-keeping start date.";
  doc.text(doc.splitTextToSize(note, 180), 15, finalY);

  doc.save(`Deployment_Plan_${clientName.replace(/\s+/g, '_')}.pdf`);
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header];
      return JSON.stringify(val === null || val === undefined ? '' : val);
    }).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFullBakeryWorkbook = (skus: SKU[], ingredients: Ingredient[], activities: Activity[], employees: Employee[], sales: Sale[], transactions: Transaction[]) => {
  const wb = XLSX.utils.book_new();
  
  const addSheet = (data: any[], name: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet(skus, 'SKUs');
  addSheet(ingredients, 'Inventory');
  addSheet(activities, 'Activities');
  addSheet(employees, 'Payroll');
  addSheet(sales, 'Sales');
  addSheet(transactions, 'Transactions');

  XLSX.writeFile(wb, `BakersAlley_Master_Workbook_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateDeliveryNotePDF = (outlet: Outlet, sku: SKU, qty: number, profile?: BusinessProfile) => {
  const doc = new jsPDF();
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(profile?.name || 'DELIVERY NOTE', 14, 18);
  doc.setFontSize(8);
  doc.text(profile?.address || '', 14, 25);
  doc.text(`TEL: ${profile?.phone || ''} | EMAIL: ${profile?.email || ''}`, 14, 29);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('OFFICIAL DELIVERY NOTE', 14, 45);
  doc.setFontSize(10);
  doc.text(`TO: ${outlet.name}`, 14, 55);
  doc.text(`LOCATION: ${outlet.location}`, 14, 60);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 14, 65);
  
  (doc as any).autoTable({
    startY: 75,
    head: [['Product', 'Quantity', 'Unit']],
    body: [[sku.name, qty, sku.unit]],
    theme: 'grid',
    headStyles: { fillColor: [30, 27, 75] }
  });
  
  doc.save(`DN_${outlet.name}_${Date.now()}.pdf`);
};

export const generateRequisitionNotePDF = (bom: any[], profile?: BusinessProfile) => {
  const doc = new jsPDF();
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(profile?.name || 'REQUISITION', 14, 18);
  doc.setFontSize(8);
  doc.text(profile?.address || '', 14, 25);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('MATERIAL REQUISITION', 14, 45);
  doc.setFontSize(10);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 14, 55);
  
  (doc as any).autoTable({
    startY: 65,
    head: [['Material', 'Needed', 'Unit', 'In Stock']],
    body: bom.map(b => [b.name, Math.round(b.needed), b.unit, Math.round(b.available)]),
    theme: 'striped',
    headStyles: { fillColor: [30, 27, 75] }
  });
  
  doc.save(`Requisition_${Date.now()}.pdf`);
};

export const generateSaleReceiptPDF = (sale: Sale, sku: SKU, currency: any, profile?: BusinessProfile) => {
  const doc = new jsPDF();
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(profile?.name || 'RECEIPT', 14, 18);
  doc.setFontSize(8);
  doc.text(profile?.address || '', 14, 24);
  doc.text(`TEL: ${profile?.phone || ''}`, 14, 28);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('SALES RECEIPT', 14, 45);
  doc.setFontSize(10);
  doc.text(`ID: ${sale.id}`, 14, 55);
  doc.text(`DATE: ${new Date(sale.date).toLocaleString()}`, 14, 60);
  
  (doc as any).autoTable({
    startY: 70,
    head: [['Item', 'Qty', 'Rate', 'Total']],
    body: [[sku.name, sale.quantity, currency.format(sale.unitPrice), currency.format(sale.totalPrice)]],
    theme: 'plain',
    headStyles: { fontStyle: 'bold' }
  });
  
  doc.save(`Receipt_${sale.id}.pdf`);
};

export const exportOrderListCSV = (orders: Order[], customers: Customer[]) => {
  const data = orders.map(o => {
    const customer = customers.find(c => c.id === o.customerId);
    return {
      Invoice: o.invoiceNumber,
      Customer: customer?.name || 'N/A',
      Date: o.date,
      Total: o.totalPrice,
      Paid: o.totalPaid,
      Status: o.status,
      Approval: o.approvalStatus
    };
  });
  downloadCSV(data, 'orders_ledger');
};

export const exportSingleOrderCSV = (order: Order, skus: SKU[]) => {
  const data = order.items.map(item => {
    const sku = skus.find(s => s.id === item.skuId);
    return {
      Product: sku?.name || 'N/A',
      Quantity: item.quantity,
      UnitPrice: item.unitPrice,
      Total: item.totalPrice
    };
  });
  downloadCSV(data, `order_${order.invoiceNumber}`);
};

export const generateNCR_ReportPDF = (log: QALog, sku: SKU) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('NON-CONFORMANCE REPORT (NCR)', 14, 20);
  doc.setFontSize(10);
  doc.text(`SKU: ${sku.name}`, 14, 35);
  doc.text(`DATE: ${new Date(log.date).toLocaleDateString()}`, 14, 40);
  
  // Fix: Reference ncrDetails which is now defined on QALog
  const details = log.ncrDetails || { rootCause: 'N/A', disposition: 'N/A', actionTaken: 'N/A' };
  
  (doc as any).autoTable({
    startY: 50,
    head: [['Field', 'Description']],
    body: [
      ['Root Cause', details.rootCause],
      ['Disposition', details.disposition],
      ['Action Taken', details.actionTaken],
      ['Technical Notes', log.notes || 'None']
    ],
    theme: 'grid'
  });
  
  doc.save(`NCR_${sku.name}_${Date.now()}.pdf`);
};

export const generateTermsPDF = () => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('TERMS & CONDITIONS', 14, 20);
  const splitText = doc.splitTextToSize(TERMS_AND_CONDITIONS, 180);
  doc.setFontSize(10);
  doc.text(splitText, 14, 35);
  doc.save('BakersAlley_Terms.pdf');
};

export const generatePackingSlipPDF = (order: Order, customer: Customer, skus: SKU[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('PACKING SLIP', 14, 20);
  doc.setFontSize(10);
  doc.text(`ORDER: ${order.invoiceNumber}`, 14, 30);
  doc.text(`CUSTOMER: ${customer.name}`, 14, 35);
  
  (doc as any).autoTable({
    startY: 45,
    head: [['Item', 'Quantity']],
    body: order.items.map(i => [skus.find(s => s.id === i.skuId)?.name || 'Unknown', i.quantity]),
    theme: 'grid'
  });
  
  doc.save(`Packing_${order.invoiceNumber}.pdf`);
};

export const generateConsolidatedPickListPDF = (items: any[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('MASTER PICK LIST', 14, 20);
  doc.setFontSize(10);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 14, 30);
  
  (doc as any).autoTable({
    startY: 40,
    head: [['Product', 'Total Quantity', 'Unit']],
    body: items.map(i => [i.name, i.qty, i.unit]),
    theme: 'grid'
  });
  
  doc.save(`PickList_${Date.now()}.pdf`);
};

export const generateUniversalReportPDF = (config: any) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(config.title, 14, 20);
  doc.setFontSize(10);
  doc.text(config.subtitle, 14, 30);
  
  (doc as any).autoTable({
    startY: 40,
    head: config.headers,
    body: config.data,
    theme: 'grid',
    styles: { fontSize: 8 }
  });
  
  doc.save(`${config.filename}.pdf`);
};

export const generateProductionJobCardPDF = (orders: Order[], skus: SKU[]) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('PRODUCTION JOB CARDS', 14, 20);
  
  orders.forEach((o, index) => {
    if (index > 0) doc.addPage();
    doc.setFontSize(16);
    doc.text(`Job #${o.invoiceNumber}`, 14, 40);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(o.date).toLocaleDateString()}`, 14, 50);
    
    (doc as any).autoTable({
      startY: 60,
      head: [['Product', 'Quantity', 'Yield Target']],
      body: o.items.map(i => {
        const sku = skus.find(s => s.id === i.skuId);
        return [sku?.name || 'Unknown', i.quantity, `${sku?.yield || 0} ${sku?.unit || 'pcs'}`];
      }),
      theme: 'grid'
    });
  });
  
  doc.save(`JobCards_${Date.now()}.pdf`);
};

export const generateDispatchManifestPDF = (date: string, outlets: Outlet[], skus: SKU[], forecasts: DailyOutletForecast[]) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Branding Header
    doc.setFillColor(30, 27, 75); // Indigo 950
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTORY DISPATCH MANIFEST', 15, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(251, 191, 36); // Amber 400
    doc.text(`DELIVERY DATE: ${date}`, 15, 30);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`SYSTEM GENERATED GUIDE: ${timestamp}`, 130, 30);

    const body = skus.map(sku => {
        const row: any[] = [sku.name];
        outlets.forEach(outlet => {
            const f = forecasts.find(x => x.outletId === outlet.id && x.skuId === sku.id && x.date === date);
            row.push(f?.forecastedQty || 0);
        });
        const total = outlets.reduce((s, o) => {
            const f = forecasts.find(x => x.outletId === o.id && x.skuId === sku.id && x.date === date);
            return s + (f?.forecastedQty || 0);
        }, 0);
        row.push(total);
        return row;
    });

    const head = [['Product', ...outlets.map(o => o.name.slice(0, 10)), 'TOTAL']];

    (doc as any).autoTable({
        startY: 55,
        head,
        body,
        theme: 'grid',
        headStyles: { fillColor: [30, 27, 75], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text('FACTORY LOADING AUTHORIZATION:', 15, finalY);
    doc.line(15, finalY + 10, 80, finalY + 10);
    doc.text('DISPATCH SUPERVISOR SIGNATURE:', 120, finalY);
    doc.line(120, finalY + 10, 185, finalY + 10);

    doc.save(`Dispatch_Manifest_${date}.pdf`);
};

export const generateInvoicePDF = (order: Order, customer: Customer, skus: SKU[], profile?: BusinessProfile) => {
  const doc = new jsPDF();
  const date = new Date(order.date).toLocaleDateString();

  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.name || 'OFFICIAL INVOICE', 14, 25);
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(profile?.address || '', 14, 34);
  doc.text(`TEL: ${profile?.phone || ''} | EMAIL: ${profile?.email || ''}`, 14, 38);
  if(profile?.taxRegistrationNumber) doc.text(`TIN: ${profile.taxRegistrationNumber}`, 14, 42);

  doc.setFontSize(10);
  doc.setTextColor(251, 191, 36);
  doc.text(`INVOICE NO: ${order.invoiceNumber}`, 150, 25);
  doc.text(`DATE: ${date}`, 150, 31);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('BILL TO:', 14, 65);
  doc.setFontSize(10);
  doc.text(customer.name, 14, 72);
  if(customer.address) doc.text(customer.address, 14, 77);
  if(customer.phone) doc.text(customer.phone, 14, 82);

  (doc as any).autoTable({
    startY: 90,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: order.items.map(item => {
      const sku = skus.find(s => s.id === item.skuId);
      return [sku?.name || 'Unknown', item.quantity, item.unitPrice.toLocaleString(), item.totalPrice.toLocaleString()];
    }),
    theme: 'grid',
    headStyles: { fillColor: [30, 27, 75] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRAND TOTAL: UGX ${order.totalPrice.toLocaleString()}`, 130, finalY + 10);

  doc.save(`Invoice_${order.invoiceNumber}.pdf`);
};
