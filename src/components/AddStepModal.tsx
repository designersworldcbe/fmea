import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Sparkles, Loader2, X } from 'lucide-react';
import { FMEAItem } from '../types';
import { suggestFMEAContent, suggestFunctions } from '../services/gemini';
import { PARAMETERS, SYMBOLS, REQUIRES_DATUM } from '../constants';

interface ProductCharacteristic {
  product: string;
  parameter: string;
  symbol?: string;
  datum?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (items: FMEAItem[]) => void;
}

export default function AddStepModal({ isOpen, onClose, onAdd }: Props) {
  const [step, setStep] = useState('');
  const [func, setFunc] = useState('');
  const [products, setProducts] = useState<ProductCharacteristic[]>([{ product: '', parameter: '' }]);
  const [loading, setLoading] = useState(false);
  const [suggestingFunc, setSuggestingFunc] = useState(false);
  const [results, setResults] = useState<Partial<FMEAItem>[]>([]);

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

  const handleAddProduct = () => setProducts([...products, { product: '', parameter: '' }]);
  const handleRemoveProductInput = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = async () => {
    if (!func || products.some(p => !p.product || !p.parameter)) {
      alert('Please enter Function and all Product characteristics.');
      return;
    }
    setLoading(true);
    try {
      let allSuggestions: Partial<FMEAItem>[] = [];
      for (const p of products) {
        const productStr = `${p.product} ${p.parameter} ${p.symbol || ''} ${p.datum ? 'WRT ' + p.datum : ''}`.trim();
        const suggestions = await suggestFMEAContent(step, func, productStr);
        allSuggestions = [...allSuggestions, ...suggestions];
      }
      setResults(allSuggestions);
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
    setProducts(['']);
    setResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
            <div className="space-y-4">
              {products.map((p, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={p.product}
                      onChange={(e) => {
                        const newP = [...products];
                        newP[i] = { ...newP[i], product: e.target.value };
                        setProducts(newP);
                      }}
                      placeholder="Product Characteristic"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                    {products.length > 1 && (
                      <button 
                        onClick={() => handleRemoveProductInput(i)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={p.parameter}
                      onChange={(e) => {
                        const newP = [...products];
                        newP[i] = { ...newP[i], parameter: e.target.value };
                        setProducts(newP);
                      }}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="">Select Parameter...</option>
                      {PARAMETERS.map(param => <option key={param} value={param}>{param}</option>)}
                    </select>

                    {p.parameter === 'GD&T' && (
                      <>
                        <select
                          value={p.symbol || ''}
                          onChange={(e) => {
                            const newP = [...products];
                            newP[i] = { ...newP[i], symbol: e.target.value };
                            setProducts(newP);
                          }}
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        >
                          <option value="">Select Symbol...</option>
                          {SYMBOLS.map(sym => <option key={sym} value={sym}>{sym}</option>)}
                        </select>
                        {REQUIRES_DATUM.includes(p.symbol || '') && (
                          <input
                            value={p.datum || ''}
                            onChange={(e) => {
                              const newP = [...products];
                              newP[i] = { ...newP[i], datum: e.target.value };
                              setProducts(newP);
                            }}
                            placeholder="Datum"
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generate Failure Modes
          </button>

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generated Scenarios</h4>
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
