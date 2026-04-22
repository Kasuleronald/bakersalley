import React, { useState } from 'react';
import { Ingredient, SKU, RecipeItem } from '../types';
import { GoogleGenAI } from "@google/genai";

interface FormulaLabProps {
  ingredients: Ingredient[];
  onImportRecipe: (sku: Partial<SKU>) => void;
  currency: { format: (v: number) => string };
}

const FormulaLab: React.FC<FormulaLabProps> = ({ ingredients, onImportRecipe, currency }) => {
  const [selectedIngIds, setSelectedIngIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);

  const toggleIngredient = (id: string) => {
    setSelectedIngIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleGenerateRecipes = async () => {
    if (selectedIngIds.length < 2) {
      alert("Select at least 2 ingredients to cross-formulate.");
      return;
    }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const available = selectedIngIds.map(id => ingredients.find(i => i.id === id)?.name).join(', ');
      
      const prompt = `
        Act as an Industrial Bakery Product Developer.
        I have these ingredients: ${available}.
        
        TASK: Generate 3 distinct bakery product recipes (Multiple Products) from these same items.
        For each product, provide:
        1. Product Name.
        2. Rationale (Why this mix works).
        3. Ingredients in precise grams (Assuming a 1kg flour base if flour is present).
        4. Target Yield (How many pieces).
        
        Return a strictly valid JSON array:
        [{ "name": "string", "rationale": "string", "yield": number, "unit": "pcs", "recipe": [{ "ingName": "string", "qty": number, "unit": "g" }] }]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setSuggestions(JSON.parse(response.text || '[]'));
    } catch (e) {
      alert("Neural synthesis failed. Verify connectivity.");
    } finally {
      setIsGenerating(false);
    }
  };

  const commitToCatalog = (sug: any) => {
    const recipeItems: RecipeItem[] = sug.recipe.map((r: any) => {
      const matched = ingredients.find(i => i.name.toLowerCase().includes(r.ingName.toLowerCase()));
      return {
        ingredientId: matched?.id || 'manual-entry',
        quantity: r.qty,
        unit: 'g'
      };
    });

    onImportRecipe({
      name: sug.name,
      yield: sug.yield,
      unit: sug.unit,
      recipeItems,
      category: 'R&D Draft',
      retailPrice: 0,
      targetMargin: 35
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-indigo-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="relative z-10 space-y-4 max-w-xl">
           <h3 className="text-3xl font-bold font-serif text-amber-400 uppercase tracking-tighter">Product Creation Lab</h3>
           <p className="text-indigo-100 text-lg leading-relaxed italic">"Select your core materials and let the AI Architect build multiple formulations for diverse products simultaneously."</p>
        </div>
        <button 
          onClick={handleGenerateRecipes}
          disabled={isGenerating || selectedIngIds.length < 2}
          className={`relative z-10 px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all ${isGenerating ? 'bg-indigo-800 text-indigo-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-amber-400'}`}
        >
          {isGenerating ? 'Cross-Formulating...' : '🧪 Generate 3 Recipes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Available Pantry Items</h4>
           <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
              {ingredients.map(ing => (
                <button 
                  key={ing.id}
                  onClick={() => toggleIngredient(ing.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${selectedIngIds.includes(ing.id) ? 'bg-indigo-900 border-indigo-900 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                   <span className="font-bold text-xs uppercase">{ing.name}</span>
                   <span className="text-xl">{selectedIngIds.includes(ing.id) ? '✓' : '+'}</span>
                </button>
              ))}
           </div>
        </aside>

        <main className="lg:col-span-8 space-y-6">
           {suggestions ? (
             <div className="grid grid-cols-1 gap-6 animate-fadeIn">
                {suggestions.map((sug, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all border-l-8 border-l-amber-500">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h4 className="text-2xl font-bold font-serif text-slate-900 uppercase">{sug.name}</h4>
                           <p className="text-xs text-slate-500 italic mt-1">"{sug.rationale}"</p>
                        </div>
                        <button 
                          onClick={() => commitToCatalog(sug)}
                          className="bg-indigo-50 text-indigo-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-900 hover:text-white transition-all"
                        >
                          Adopt Recipe
                        </button>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {sug.recipe.map((r: any, i: number) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-2xl">
                             <div className="text-[8px] font-black text-slate-400 uppercase truncate">{r.ingName}</div>
                             <div className="text-sm font-mono font-black text-indigo-900">{r.qty}{r.unit}</div>
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="h-full py-32 border-2 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-center opacity-30 grayscale space-y-6">
                <div className="text-8xl">📜</div>
                <h4 className="text-xl font-bold font-serif uppercase tracking-widest text-slate-400">Pantry Selection Required</h4>
                <p className="text-sm text-slate-400 max-w-sm italic">Choose materials from the pantry to see the multiple recipe possibilities for your bakery.</p>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default FormulaLab;