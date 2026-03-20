import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, ChevronLeft, Sparkles, Loader2, Library, BookOpen, FileSpreadsheet, X } from 'lucide-react';
import { motion } from 'motion/react';
import { FMEA, FMEAItem } from '../types';
import { suggestFMEAContent, suggestRecommendedAction, suggestFunctions } from '../services/gemini';
import { exportFMEAToExcel } from '../services/excel';
import { InputGroup } from './SharedComponents';
import AddStepModal from './AddStepModal';
import { PARAMETERS, SYMBOLS, REQUIRES_DATUM } from '../constants';

interface Props {
  fmea: FMEA;
  onBack: () => void;
  onSave: (data: FMEA) => Promise<void> | void;
  isSaving: boolean;
}

export default function FMEAEditor({ fmea, onBack, onSave, isSaving }: Props) {
  const { register, control, handleSubmit, watch, setValue } = useForm<FMEA>({
    defaultValues: fmea
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items"
  });

  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [libraryLoading, setLibraryLoading] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-save logic
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change' && name?.startsWith('items')) {
        const timer = setTimeout(() => {
          handleSubmit(onSave)();
          setLastSaved(new Date().toLocaleTimeString());
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, handleSubmit, onSave]);

  const handleLibrarySearch = async (index: number) => {
    const item = watch(`items.${index}`);
    if (!item.function || !item.product) {
      alert('Please enter Function and Product characteristic first.');
      return;
    }

    setLibraryLoading(index);
    try {
      const params = new URLSearchParams({
        process_step: item.process_step || '',
        function: item.function,
        product: item.product,
        process: item.process || '',
        potential_failure_mode: item.potential_failure_mode || ''
      });
      const res = await fetch(`/api/library/search?${params}`);
      const results = await res.json();
      
      if (results.length > 0) {
        const match = results[0];
        const updatedItem = { ...item, ...match };
        delete updatedItem.id; 
        update(index, updatedItem as FMEAItem);
      } else {
        alert('No matching entries found in library.');
      }
    } catch (e) {
      console.error(e);
      alert('Library search failed.');
    } finally {
      setLibraryLoading(null);
    }
  };

  const handleSaveToLibrary = async (index: number) => {
    const item = watch(`items.${index}`);
    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      alert('Item saved to library!');
    } catch (e) {
      console.error(e);
      alert('Failed to save to library.');
    }
  };

  const handleAISuggest = async (index: number) => {
    const item = watch(`items.${index}`);
    if (!item.function || !item.product) {
      alert('Please enter Function and Product characteristic first.');
      return;
    }

    setAiLoading(index);
    try {
      const suggestions = await suggestFMEAContent(item.process_step || '', item.function, item.product);
      if (suggestions.length > 0) {
        const first = suggestions[0];
        update(index, { ...item, ...first } as FMEAItem);

        if (suggestions.length > 1) {
          suggestions.slice(1).forEach(s => {
            append({
              ...s,
              char_id: '',
              responsibility: '',
              target_date: '',
              action_taken: '',
              effective_date: '',
              res_severity: 1,
              res_occurrence: 1,
              res_detection: 1,
              res_rpn: 1
            } as FMEAItem);
          });
        }
      }
    } catch (e) {
      console.error(e);
      alert('AI Suggestion failed.');
    } finally {
      setAiLoading(null);
    }
  };

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleActionSuggest = async (index: number) => {
    const item = watch(`items.${index}`);
    if (!item.potential_failure_mode || !item.potential_effects || !item.potential_causes) {
      alert('Please fill Failure Mode, Effects, and Causes first.');
      return;
    }

    setActionLoading(index);
    try {
      const suggestion = await suggestRecommendedAction(
        item.potential_failure_mode,
        item.potential_effects,
        item.potential_causes
      );
      setValue(`items.${index}.recommended_action`, suggestion);
      handleSubmit(onSave)();
    } catch (e) {
      console.error(e);
      alert('Action suggestion failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    const data = watch();
    exportFMEAToExcel(data);
  };

  const updateCombinedProcess = (index: number) => {
    const param = watch(`items.${index}.process_parameter`) || '';
    const spec = watch(`items.${index}.process_spec`) || '';
    const sym = watch(`items.${index}.process_symbol`) || '';
    const datum = watch(`items.${index}.process_datum`) || '';
    
    let combined = `${param} ${spec} ${sym}`.trim();
    if (datum && REQUIRES_DATUM.includes(sym)) {
      combined += ` WRT ${datum}`;
    }
    setValue(`items.${index}.process`, combined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium transition-colors"
        >
          <ChevronLeft size={20} />
          Back to List
        </button>
        <div className="flex gap-3 items-center">
          {lastSaved && (
            <span className="text-xs text-gray-400 italic">Auto-saved at {lastSaved}</span>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-emerald-600 text-gray-700 hover:text-emerald-600 px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>
          <button
            onClick={handleSubmit(onSave)}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save PFMEA
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <InputGroup label="Drawing No" {...register('draw_no')} />
          <InputGroup label="Part Name" {...register('part_name')} />
          <InputGroup label="Customer Name" {...register('customer_name')} />
          <InputGroup label="Process Responsibility" {...register('process_responsibility')} />
          <InputGroup label="Key Review Date" type="date" {...register('key_review_date')} />
          <InputGroup label="FMEA No" {...register('fmea_no')} />
          <InputGroup label="Date (ORI)" type="date" {...register('date')} />
          <InputGroup label="Rev No" {...register('rev_no')} />
          <InputGroup label="Rev Date" type="date" {...register('rev_date')} />
          <InputGroup label="Prepared By" {...register('prepared_by')} />
          <InputGroup label="Reviewed By" {...register('reviewed_by')} />
          <InputGroup label="Approved By" {...register('approved_by')} />
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-200">
                <th className="p-3 text-left border-r border-gray-200 min-w-[150px]">Process Step</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[150px]">Function</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[80px]">ID</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[150px]">Product</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[150px]">Process</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[200px]">Failure Mode</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[200px]">Effects</th>
                <th className="p-3 text-center border-r border-gray-200 w-16">S</th>
                <th className="p-3 text-center border-r border-gray-200 w-16">Class</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[200px]">Causes</th>
                <th className="p-3 text-center border-r border-gray-200 w-16">O</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[200px]">Prev. Controls</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[200px]">Det. Controls</th>
                <th className="p-3 text-center border-r border-gray-200 w-16">D</th>
                <th className="p-3 text-center border-r border-gray-200 w-20">RPN</th>
                <th className="p-3 text-left border-r border-gray-200 min-w-[200px]">Rec. Action</th>
                <th className="p-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const severity = watch(`items.${index}.severity`) || 0;
                const occurrence = watch(`items.${index}.occurrence`) || 0;
                const detection = watch(`items.${index}.detection`) || 0;
                const rpn = severity * occurrence * detection;
                const isHighRisk = rpn > 100;
                const actionValue = watch(`items.${index}.recommended_action`);
                const needsAction = isHighRisk && !actionValue;

                return (
                <tr key={field.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <td className="p-2 border-r border-gray-100">
                    <textarea {...register(`items.${index}.process_step`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Step..." />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <textarea {...register(`items.${index}.function`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Function..." />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <input {...register(`items.${index}.char_id`)} className="w-full bg-transparent border-none focus:ring-0 p-1" placeholder="ID" />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <textarea {...register(`items.${index}.product`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Product..." />
                  </td>
                  <td className="p-2 border-r border-gray-100 min-w-[250px]">
                    <div className="flex flex-col gap-2">
                      <select 
                        {...register(`items.${index}.process_parameter`, {
                          onChange: () => updateCombinedProcess(index)
                        })} 
                        className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      >
                        <option value="">Select Parameter...</option>
                        {PARAMETERS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      
                      <div className="flex gap-1">
                        <input 
                          {...register(`items.${index}.process_spec`, {
                            onChange: () => updateCombinedProcess(index)
                          })} 
                          className="flex-1 bg-gray-50 border border-gray-200 rounded p-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none" 
                          placeholder="Spec (e.g. 50)" 
                        />
                        <select 
                          {...register(`items.${index}.process_symbol`, {
                            onChange: () => updateCombinedProcess(index)
                          })} 
                          className="w-20 bg-gray-50 border border-gray-200 rounded p-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                        >
                          <option value="">Sym</option>
                          {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {REQUIRES_DATUM.includes(watch(`items.${index}.process_symbol`) || '') && (
                        <input 
                          {...register(`items.${index}.process_datum`, {
                            onChange: () => updateCombinedProcess(index)
                          })} 
                          className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none" 
                          placeholder="Datum (WRT)" 
                        />
                      )}
                      
                      {/* Visible field to store the combined value for export/legacy, allowing manual override or viewing AI output */}
                      <textarea 
                        {...register(`items.${index}.process`)} 
                        className="w-full bg-white border border-gray-200 rounded p-1 resize-none min-h-[40px] text-xs text-gray-600 focus:ring-1 focus:ring-emerald-500 outline-none" 
                        placeholder="Combined Process..." 
                      />
                    </div>
                  </td>
                  <td className="p-2 border-r border-gray-100 relative">
                    <textarea {...register(`items.${index}.potential_failure_mode`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Failure Mode..." />
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={() => handleLibrarySearch(index)}
                        disabled={libraryLoading === index}
                        className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                        title="Search Library"
                      >
                        {libraryLoading === index ? <Loader2 className="animate-spin" size={14} /> : <Library size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAISuggest(index)}
                        disabled={aiLoading === index}
                        className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 disabled:opacity-50"
                        title="AI Suggestion"
                      >
                        {aiLoading === index ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <textarea {...register(`items.${index}.potential_effects`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Effects..." />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <input type="number" min="1" max="10" {...register(`items.${index}.severity`, { valueAsNumber: true })} className="w-full text-center bg-transparent border-none focus:ring-0 p-1" />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <input {...register(`items.${index}.class`)} className="w-full text-center bg-transparent border-none focus:ring-0 p-1" placeholder="Class" />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <textarea {...register(`items.${index}.potential_causes`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Causes..." />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <input type="number" min="1" max="10" {...register(`items.${index}.occurrence`, { valueAsNumber: true })} className="w-full text-center bg-transparent border-none focus:ring-0 p-1" />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <textarea {...register(`items.${index}.current_prevention`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Prevention..." />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <textarea {...register(`items.${index}.current_detection`)} className="w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px]" placeholder="Detection..." />
                  </td>
                  <td className="p-2 border-r border-gray-100">
                    <input type="number" min="1" max="10" {...register(`items.${index}.detection`, { valueAsNumber: true })} className="w-full text-center bg-transparent border-none focus:ring-0 p-1" />
                  </td>
                  <td className={`p-2 border-r border-gray-100 text-center font-bold transition-colors ${isHighRisk ? 'text-red-600 bg-red-50' : 'text-emerald-700'}`}>
                    {rpn}
                    {isHighRisk && <div className="text-[9px] font-normal text-red-500 mt-1 leading-tight">Action<br/>Req.</div>}
                  </td>
                  <td className={`p-2 border-r border-gray-100 relative transition-colors ${needsAction ? 'bg-red-50/50' : ''}`}>
                    <textarea 
                      {...register(`items.${index}.recommended_action`, { required: isHighRisk })} 
                      className={`w-full bg-transparent border-none focus:ring-0 p-1 resize-none min-h-[60px] ${needsAction ? 'placeholder-red-400' : ''}`} 
                      placeholder={needsAction ? "Action required (RPN > 100)..." : "Action..."} 
                    />
                    <button
                      type="button"
                      onClick={() => handleActionSuggest(index)}
                      disabled={actionLoading === index}
                      className="absolute bottom-2 right-2 p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="AI Suggest Action"
                    >
                      {actionLoading === index ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveToLibrary(index)}
                        className="text-gray-300 hover:text-emerald-600 transition-colors"
                        title="Save to Library"
                      >
                        <BookOpen size={16} />
                      </button>
                      <button onClick={() => remove(index)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-all font-medium flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Process Step
        </button>

        <AddStepModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={(items) => {
            items.forEach(item => append(item));
            setIsModalOpen(false);
          }}
        />
      </div>
    </motion.div>
  );
}
