import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const COLORS = {
  indigo: [30, 27, 75],
  amber: [245, 158, 11],
  slate: [100, 116, 139],
  lightGray: [248, 250, 252],
  emerald: [16, 185, 129],
  rose: [225, 29, 72]
};

const drawHeader = (doc: jsPDF, title: string, subtitle: string) => {
  doc.setFillColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BAKERSALLEY 3.1', 15, 20);
  
  doc.setTextColor(COLORS.amber[0], COLORS.amber[1], COLORS.amber[2]);
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 15, 28);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(`SYSTEM DOCUMENTATION • ${new Date().toLocaleString()}`, 140, 28);
};

export const generateFullUserManualPDF = (sections: any[]) => {
  const doc = new jsPDF();
  
  // 1. Cover Page
  doc.setFillColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(44);
  doc.setFont('helvetica', 'bold');
  doc.text('MASTER SYSTEM', 20, 100);
  doc.text('MANUAL', 20, 120);
  
  doc.setFontSize(18);
  doc.setTextColor(COLORS.amber[0], COLORS.amber[1], COLORS.amber[2]);
  doc.text('BakersAlley Industrial ERP v3.1', 20, 135);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Operational Guide & Functional Logic Spec', 20, 145);
  
  doc.setTextColor(255, 255, 255);
  doc.text(`Documentation Release: ${new Date().toLocaleDateString()}`, 20, 260);
  doc.text('Proprietary & Confidential • Staff Copy', 20, 270);

  // 2. Comparative Analysis (EzeeYPOS vs BakersAlley)
  doc.addPage();
  drawHeader(doc, 'Strategic Comparison', 'Industry Benchmarking');
  doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('The BakersAlley Edge vs. Retail POS (e.g. EzeeYPOS)', 15, 60);

  const comparisonData = [
    ['Feature', 'Standard Retail POS (EzeeYPOS)', 'BakersAlley 3.1 Industrial ERP'],
    ['Costing', 'Basic Inventory Avg. Cost', 'Activity-Based Costing (Labor + Firewood)'],
    ['Reconciliation', 'Sold units only', 'Mass Balance: Produced vs. Sold vs. Wasted'],
    ['Compliance', 'Basic URA EFRIS Receipts', 'EFRIS + UNBS S-Mark Traceability (DNA)'],
    ['Forecasting', 'Static Min/Max Levels', 'Neural S&OP (Predicted Route Demand)'],
    ['Security', 'Server-Stored Records', 'Zero-Knowledge Private Cloud (Private Drive)'],
    ['Growth', 'Passive Sales Record', 'Active B2B Lead Discovery (Neural Search)']
  ];

  (doc as any).autoTable({
    startY: 70,
    head: [comparisonData[0]],
    body: comparisonData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: COLORS.indigo },
    columnStyles: { 
      0: { fontStyle: 'bold', width: 40 },
      1: { textColor: [100, 100, 100] },
      2: { fontStyle: 'bold', textColor: COLORS.indigo }
    }
  });

  // 3. Module Sections
  sections.forEach((section) => {
    doc.addPage();
    drawHeader(doc, 'Module Guide', section.title);
    
    let y = 60;
    doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`${section.icon} ${section.title}`, 15, y);
    
    y += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const splitOverview = doc.splitTextToSize(section.overview, 180);
    doc.text(splitOverview, 15, y);
    
    y += (splitOverview.length * 5) + 10;
    
    section.content.forEach((item: any) => {
      const descLines = doc.splitTextToSize(item.desc, 165);
      const itemHeight = (descLines.length * 5) + 25;
      
      if (y + itemHeight > 270) {
        doc.addPage();
        drawHeader(doc, 'Module Guide (Cont.)', section.title);
        y = 60;
      }
      
      doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
      doc.roundedRect(15, y, 180, itemHeight - 5, 3, 3, 'F');
      
      doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(item.tool.toUpperCase(), 22, y + 10);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(descLines, 22, y + 18);
      
      y += itemHeight + 5;
    });
  });

  doc.save('BakersAlley_Master_Manual_V3.pdf');
};

export const generateModuleSpecPDF = (section: any) => {
  const doc = new jsPDF();
  drawHeader(doc, 'Unit Specification', section.title);

  let y = 60;
  doc.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${section.icon} ${section.title} Unit Spec`, 15, y);
  
  const body = section.content.map((c: any) => [c.tool, c.desc]);

  (doc as any).autoTable({
    startY: 75,
    head: [['System Component', 'Operational Procedure & Logic']],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: COLORS.indigo, fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 6, valign: 'middle' },
    columnStyles: { 
      0: { fontStyle: 'bold', width: 50, textColor: COLORS.indigo },
      1: { fontSize: 9 }
    }
  });

  doc.save(`Spec_${section.title.replace(/\s+/g, '_')}.pdf`);
};
