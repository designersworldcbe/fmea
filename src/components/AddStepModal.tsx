import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Sparkles, Loader2, X, Database, AlertCircle } from 'lucide-react';
import { FMEAItem } from '../types';
import { suggestFMEAContent, suggestFunctions } from '../services/gemini';

const PARAMETERS = [
  "Distance", "Diameter", "Inner Diameter", "Outer Diameter", "Length", "Width", 
  "Thickness", "Angle", "Surface Finish", "Tap", "Form", "Orientation", 
  "Location", "Runout", "Other"
];

const SYMBOLS = [
  "+", "-", "±", "°", 
  "—", "⏥", "◯", "⌭", 
  "⌓", "⌢", 
  "⟂", "∥", "∠", 
  "⌖", "◎", "⌕", 
  "↗", "⌰", 
  "Ⓜ", "Ⓛ", "⌀", "R", "CR"
];

const REQUIRES_DATUM = [
  "⟂", "∥", "∠", 
  "⌖", "◎", "⌕", 
  "↗", "⌰"
];

const GDT_SYMBOLS = [
  "—", "⏥", "◯", "⌭", 
  "⌓", "⌢", 
  "⟂", "∥", "∠", 
  "⌖", "◎", "⌕", 
  "↗", "⌰", 
  "Ⓜ", "Ⓛ", "⌀", "R", "CR"
];

interface ProductInput {
  parameter: string;
  spec: string;
  symbol: string;
  datum: string;
  tolerance: string;
  upper: string;
  lower: string;
  auto_calc: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (items: FMEAItem[]) => void;
}

export default function AddStepModal({ isOpen, onClose, onAdd }: Props) {
  const [step, setStep] = useState('');
  const [func, setFunc] = useState('');
  const [products, setProducts] = useState<ProductInput[]>([{ parameter: '', spec: '', symbol: '', datum: '', tolerance: '', upper: '', lower: '', auto_calc: true }]);
  const [loading, setLoading] = useState(false);
  const [suggestingFunc, setSuggestingFunc] = useState(false);
  const [results, setResults] = useState<Partial<FMEAItem>[]>([]);
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  const formatCombined = (param: string, spec: string, sym: string, datum: string, tol: string, upper: string, lower: string) => {
    if (param === 'GD&T') {
      const parts = [sym, spec, tol, datum].filter(Boolean);
      return parts.length > 0 ? `|${parts.join('|')}|` : 'GD&T';
    }
    let combined = `${param} ${sym} ${spec}`;
    if (tol) combined += ` ±${tol}`;
    if (upper || lower) combined += ` [${lower} ... ${upper}]`;
    return combined.trim();
  };

  const calculateLimits = (spec: string, tol: string, sym: string) => {
    const specVal = parseFloat(spec);
    const tolVal = parseFloat(tol);
    if (isNaN(specVal) || isNaN(tolVal)) return { upper: '', lower: '' };

    if (sym === '+') {
      return {
        upper: Number((specVal + tolVal).toFixed(4)).toString(),
        lower: specVal.toString()
      };
    } else if (sym === '-') {
      return {
        upper: specVal.toString(),
        lower: Number((specVal - tolVal).toFixed(4)).toString()
      };
    } else {
      return {
        upper: Number((specVal + tolVal).toFixed(4)).toString(),
        lower: Number((specVal - tolVal).toFixed(4)).toString()
      };
    }
  };

  const updateProduct = (index: number, field: keyof ProductInput, value: any) => {
    const newP = [...products];
    newP[index] = { ...newP[index], [field]: value };
    
    if (field === 'symbol' && GDT_SYMBOLS.includes(value)) {
      newP[index].parameter = 'GD&T';
    }
    
    if (newP[index].auto_calc && newP[index].parameter !== 'GD&T') {
      const limits = calculateLimits(newP[index].spec, newP[index].tolerance, newP[index].symbol);
      newP[index].upper = limits.upper;
      newP[index].lower = limits.lower;
    } else if (newP[index].auto_calc) {
      newP[index].upper = '';
      newP[index].lower = '';
    }
    
    setProducts(newP);
  };

  const handleSuggestFunctions = async () => {
    if (!step) {
      alert('Please enter a Process Step first.');
      return;
    }
    setSuggestingFunc(true);
    try {
      const suggestions = await suggestFunctions(step);
      if (suggestions.length > 0) {
        setFunc(suggestions[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSuggestingFunc(false);
    }
  };

  const handleAddProduct = () => setProducts([...products, { parameter: '', spec: '', symbol: '', datum: '' }]);
  const handleRemoveProductInput = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleCheckKnowledgeBase = async () => {
    if (!func || products.some(p => !p.parameter)) {
      alert('Please enter Function and select at least a Parameter for all Product characteristics.');
      return;
    }
    setLoading(true);
    setShowAIPrompt(false);
    try {
      const res = await fetch('/api/library/search');
      const libraryData: Partial<FMEAItem>[] = await res.json();
      
      let foundItems: Partial<FMEAItem>[] = [];
      
      for (const p of products) {
        const combinedProduct = formatCombined(p.parameter, p.spec, p.symbol, p.datum, p.tolerance, p.upper, p.lower);
        const matches = libraryData.filter(item => {
          const stepMatch = item.process_step?.toLowerCase().includes(step.toLowerCase());
          const funcMatch = item.function?.toLowerCase().includes(func.toLowerCase());
          
          if (!stepMatch && !funcMatch) return false;
          
          const prodStr = (item.product || '').toLowerCase();
          const paramMatch = (p.parameter && p.parameter !== 'GD&T') ? prodStr.includes(p.parameter.toLowerCase()) : true;
          const symMatch = p.symbol ? prodStr.includes(p.symbol.toLowerCase()) : true;
          
          return paramMatch && symMatch;
        });
        
        const enrichedMatches = matches.map(m => ({
          ...m,
          product_parameter: p.parameter,
          product_spec: p.spec,
          product_symbol: p.symbol,
          product_datum: p.datum,
          product_tolerance: p.tolerance,
          product_upper: p.upper,
          product_lower: p.lower,
          product_auto_calc: p.auto_calc,
          product: combinedProduct
        }));
        
        foundItems = [...foundItems, ...enrichedMatches];
      }

      const uniqueItems = Array.from(new Set(foundItems.map(a => a.id)))
        .map(id => foundItems.find(a => a.id === id))
        .filter(Boolean) as Partial<FMEAItem>[];

      if (uniqueItems.length > 0) {
        setResults(uniqueItems);
      } else {
        setResults([]);
        setShowAIPrompt(true);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to search knowledge base.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!func || products.some(p => !p.parameter)) {
      alert('Please enter Function and select at least a Parameter for all Product characteristics.');
      return;
    }
    setLoading(true);
    try {
      let allSuggestions: Partial<FMEAItem>[] = [];
      for (const p of products) {
        const combinedProduct = formatCombined(p.parameter, p.spec, p.symbol, p.datum);
        const suggestions = await suggestFMEAContent(step, func, combinedProduct);
        
        const enrichedSuggestions = suggestions.map(s => ({
          ...s,
          product_parameter: p.parameter,
          product_spec: p.spec,
          product_symbol: p.symbol,
          product_datum: p.datum,
          product: combinedProduct
        }));
        
        allSuggestions = [...allSuggestions, ...enrichedSuggestions];
      }
      setResults(allSuggestions);
      setShowAIPrompt(false);
    } catch (e) {
      console.error(e);
      alert('Failed to generate scenarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveResult = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const items = results.map(r => ({
      ...r,
      char_id: '',
      responsibility: '',
      target_date: '',
      action_taken: '',
      effective_date: '',
      res_severity: 1,
      res_occurrence: 1,
      res_detection: 1,
      res_rpn: 1
    } as FMEAItem));
    onAdd(items);
    setStep('');
    setFunc('');
    setProducts([{ parameter: '', spec: '', symbol: '', datum: '' }]);
    setResults([]);
    setShowAIPrompt(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add Process Step</h3>
            <p className="text-sm text-gray-500">Define step details and generate failure modes</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Process Step</label>
              <input
                value={step}
                onChange={(e) => setStep(e.target.value)}
                placeholder="e.g. 20-VMC operation"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Function</label>
                <button 
                  onClick={handleSuggestFunctions}
                  disabled={suggestingFunc || !step}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {suggestingFunc ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />}
                  Suggest
                </button>
              </div>
              <input
                value={func}
                onChange={(e) => setFunc(e.target.value)}
                placeholder="e.g. Removal of material"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Product Characteristics</label>
              <button 
                onClick={handleAddProduct}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus size={10} />
                Add Product
              </button>
            </div>
            <div className="space-y-3">
              {products.map((p, i) => (
                <div key={i} className="flex flex-col gap-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <select 
                      value={p.parameter}
                      onChange={(e) => updateProduct(i, 'parameter', e.target.value)}
                      className="w-full sm:w-1/3 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Parameter...</option>
                      {PARAMETERS.map(param => <option key={param} value={param}>{param}</option>)}
                    </select>
                    
                    <select 
                      value={p.symbol}
                      onChange={(e) => updateProduct(i, 'symbol', e.target.value)}
                      className="w-full sm:w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Sym</option>
                      {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <input 
                      value={p.spec}
                      onChange={(e) => updateProduct(i, 'spec', e.target.value)}
                      className="w-full sm:flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" 
                      placeholder="Spec (e.g. 50)" 
                    />

                    <input 
                      value={p.tolerance}
                      onChange={(e) => updateProduct(i, 'tolerance', e.target.value)}
                      className="w-full sm:flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" 
                      placeholder="Tol (e.g. 0.1)" 
                    />

                    {REQUIRES_DATUM.includes(p.symbol) && (
                      <input 
                        value={p.datum}
                        onChange={(e) => updateProduct(i, 'datum', e.target.value)}
                        className="w-full sm:w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none" 
                        placeholder="Datum (WRT)" 
                      />
                    )}

                    {products.length > 1 && (
                      <button 
                        onClick={() => handleRemoveProductInput(i)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-auto"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {p.parameter !== 'GD&T' && (
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={p.auto_calc}
                          onChange={(e) => updateProduct(i, 'auto_calc', e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Auto-calculate limits
                      </label>
                      <input 
                        value={p.upper}
                        onChange={(e) => updateProduct(i, 'upper', e.target.value)}
                        disabled={p.auto_calc}
                        className="w-24 bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:text-gray-500" 
                        placeholder="Upper" 
                      />
                      <input 
                        value={p.lower}
                        onChange={(e) => updateProduct(i, 'lower', e.target.value)}
                        disabled={p.auto_calc}
                        className="w-24 bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:text-gray-500" 
                        placeholder="Lower" 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!showAIPrompt && results.length === 0 ? (
            <button
              onClick={handleCheckKnowledgeBase}
              disabled={loading}
              className="w-full py-3 bg-[#004F8C] text-white rounded-xl font-bold hover:bg-[#003A6A] transition-all shadow-lg shadow-[#004F8C]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
              Check Knowledge Base
            </button>
          ) : showAIPrompt ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">No suitable data found in Knowledge Base</h4>
                  <p className="text-xs text-amber-700 mt-1">We couldn't find existing failure modes for these characteristics. Would you like to generate them using AI?</p>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Generate with AI
              </button>
            </div>
          ) : null}

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Found / Generated Scenarios</h4>
                <span className="text-[10px] text-gray-400 italic">Review and remove unwanted items</span>
              </div>
              <div className="space-y-2">
                {results.map((res, i) => (
                  <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-start group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">
                          {res.product}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${(res.severity || 0) * (res.occurrence || 0) * (res.detection || 0) > 100 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          RPN: {(res.severity || 0) * (res.occurrence || 0) * (res.detection || 0)}
                        </span>
                        <p className="text-sm font-bold text-gray-800">{res.potential_failure_mode}</p>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">Effect: {res.potential_effects}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">Cause: {res.potential_causes}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveResult(i)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={results.length === 0}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
          >
            Add to FMEA
          </button>
        </div>
      </motion.div>
    </div>
  );
}
