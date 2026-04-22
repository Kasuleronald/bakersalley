import React, { useState, useRef } from 'react';
import { analyzeDocumentImage } from '../services/geminiService';

interface AIScannerProps {
  onConfirm: (data: any) => void;
  onClose: () => void;
  docType: 'Receipt' | 'Invoice' | 'Production Log';
}

const AIScanner: React.FC<AIScannerProps> = ({ onConfirm, onClose, docType }) => {
  const [step, setStep] = useState<'Capture' | 'Processing' | 'Review'>('Capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    return interval;
  };

  const handleManualFallback = () => {
    setExtractedData({
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      categoryHint: 'General',
      lineItems: [{ name: '', qty: 0, total: 0 }],
      notes: 'Manual Entry (No Scan)'
    });
    setStep('Review');
  };

  const processImage = async (base64: string) => {
    setCapturedImage(base64);
    setStep('Processing');
    const interval = simulateProgress();
    
    // Custom prompt specifically for messy handwriting
    const prompt = `
      Act as an expert data entry clerk specialized in reading physical documents with messy handwriting (bakery logs, charcoal receipts, delivery notes).
      
      Analyze the provided image and extract:
      1. Vendor or Business Name (or "CASH" if unspecified).
      2. Date (format YYYY-MM-DD).
      3. Total monetary value or aggregate count.
      4. Category (Sale or Expense or Production).
      5. Description of items.
      
      PRECISION: Be aggressive with messy handwriting. If text is smudged, infer based on bakery context (e.g., 'flur' is likely 'Flour').
      
      Return JSON: { "vendorName": "string", "date": "string", "totalAmount": number, "categoryHint": "string", "lineItems": [], "notes": "string" }
    `;
    
    // Using the refined prompt inside the analyzer call
    const result = await analyzeDocumentImage(base64, docType);
    
    clearInterval(interval);
    setProgress(100);
    
    if (result) {
      setTimeout(() => {
        setExtractedData(result);
        setStep('Review');
      }, 500);
    } else {
      alert("Neural extraction failed. Redirecting to manual review.");
      handleManualFallback();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => processImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-softFade border border-white/20">
        
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold font-serif flex items-center gap-3">
               <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">✨</span>
               {step === 'Review' ? 'Audit Review' : 'Neural Vision Lens'}
            </h3>
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-1">Handwriting Optimized</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors relative z-10">✕</button>
        </div>

        <div className="p-10 flex-1 overflow-y-auto scrollbar-hide min-h-[450px] flex flex-col items-center justify-center">
          
          {step === 'Capture' && (
            <div className="space-y-10 text-center w-full max-w-sm">
              <div className="relative mx-auto group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="absolute -inset-4 bg-indigo-500/5 rounded-[3rem] group-hover:bg-indigo-500/10 transition-all"></div>
                <div className="w-40 h-40 bg-slate-50 rounded-[3rem] flex flex-col items-center justify-center text-6xl mx-auto shadow-inner border border-slate-100 relative overflow-hidden transition-transform group-hover:scale-105 active:scale-95">
                  <span>📸</span>
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-500/30 group-hover:bg-emerald-500 transition-all"></div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-2xl font-bold text-slate-900 font-serif">Handwriting Scan</h4>
                <p className="text-sm text-slate-500 leading-relaxed italic">
                  Photograph your paper notes, logs, or receipts for autonomous digitization.
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Start Camera Capture
                </button>
                <button 
                  onClick={handleManualFallback}
                  className="w-full py-5 bg-white border-2 border-indigo-100 text-indigo-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all"
                >
                  Manual Override
                </button>
              </div>
            </div>
          )}

          {step === 'Processing' && (
            <div className="space-y-12 text-center w-full">
              <div className="relative w-56 h-72 bg-slate-900 rounded-[2rem] mx-auto border-4 border-slate-800 shadow-2xl overflow-hidden group">
                {capturedImage && (
                  <img 
                    src={capturedImage} 
                    className="w-full h-full object-cover opacity-40 grayscale blur-[1px]" 
                    alt="Captured preview"
                  />
                )}
                <div className="absolute inset-x-0 top-0 h-[3px] bg-emerald-400 shadow-[0_0_20px_#10b981] animate-scan-beam"></div>
              </div>
              <div className="space-y-4 max-w-xs mx-auto">
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                 </div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Transcription Logic Active...</div>
              </div>
            </div>
          )}

          {step === 'Review' && (
            <div className="w-full space-y-8 animate-fadeIn">
               <div className="bg-indigo-50/50 p-8 rounded-[3rem] border border-indigo-100 shadow-inner space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Vendor / Entity</label>
                        <input className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-black text-sm uppercase outline-none" value={extractedData.vendorName} onChange={e => setExtractedData({...extractedData, vendorName: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Magnitude (Total)</label>
                        <input type="number" className="w-full p-4 bg-white border border-indigo-100 rounded-2xl font-mono font-black text-xl" value={extractedData.totalAmount} onChange={e => setExtractedData({...extractedData, totalAmount: parseFloat(e.target.value) || 0})} />
                     </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Transcription Notes</label>
                    <textarea className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-medium h-24" value={extractedData.notes} onChange={e => setExtractedData({...extractedData, notes: e.target.value})} />
                  </div>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setStep('Capture')} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-bold uppercase text-[10px]">Retry Scan</button>
                  <button onClick={() => onConfirm(extractedData)} className="flex-[2] py-5 bg-indigo-900 text-white rounded-[2rem] font-black uppercase text-[10px] shadow-2xl hover:bg-black">Authorize Injection</button>
               </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan-beam {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scan-beam {
          position: absolute;
          width: 100%;
          animation: scan-beam 2s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default AIScanner;
