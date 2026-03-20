import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { ControlPlan, ControlPlanItem } from '../types';
import { suggestControlPlanDetails } from '../services/gemini';
import { Plus, Trash2, Save, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { InputGroup } from './SharedComponents';
import GeneratePlanModal from './GeneratePlanModal';

interface Props {
  plan: ControlPlan;
  onSave: (data: ControlPlan) => Promise<void>;
  onBack: () => void;
}

export default function ControlPlanEditor({ plan, onSave, onBack }: Props) {
  const { register, control, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<ControlPlan>({
    defaultValues: plan
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

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

  const handleAISuggest = async (index: number) => {
    const item = watch(`items.${index}`);
    if (!item.product_char && !item.process_char) {
      alert('Please enter Product or Process characteristics first.');
      return;
    }

    setAiLoading(index);
    try {
      const suggestion = await suggestControlPlanDetails(item.product_char || '', item.process_char || '', item.spec || '');
      if (suggestion.eval_method) setValue(`items.${index}.eval_method`, suggestion.eval_method);
      if (suggestion.sample_size) setValue(`items.${index}.sample_size`, suggestion.sample_size);
      if (suggestion.sample_freq) setValue(`items.${index}.sample_freq`, suggestion.sample_freq);
      if (suggestion.control_method) setValue(`items.${index}.control_method`, suggestion.control_method);
      if (suggestion.reaction_plan) setValue(`items.${index}.reaction_plan`, suggestion.reaction_plan);
    } catch (e) {
      console.error(e);
      alert('AI Suggestion failed.');
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#004F8C]">Control Plan</h2>
            <p className="text-xs text-gray-500">Part: {plan.part_name || 'New Part'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && <span className="text-[10px] text-gray-400 font-medium italic">Auto-saved at {lastSaved}</span>}
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm"
          >
            <Sparkles size={16} />
            Generate Full Plan
          </button>
          <button
            onClick={handleSubmit(onSave)}
            className="flex items-center gap-2 px-4 py-2 bg-[#004F8C] text-white rounded hover:bg-[#003A6A] transition-all font-medium text-sm shadow-sm"
          >
            <Save size={16} />
            Save Plan
          </button>
        </div>
      </div>
      
      <GeneratePlanModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={(items) => {
          items.forEach(item => append(item));
        }}
        partName={watch('part_name') || ''}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-xs font-bold text-[#004F8C] uppercase tracking-widest mb-4">Header Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <InputGroup label="Draw No" {...register('draw_no')} />
            <InputGroup label="Part Name" {...register('part_name')} />
            <InputGroup label="Customer" {...register('customer_name')} />
            <InputGroup label="CP No" {...register('cp_no')} />
            <InputGroup label="Responsibility" {...register('process_responsibility')} />
            <InputGroup label="Review Date" type="date" {...register('key_review_date')} />
            <InputGroup label="Rev No" {...register('rev_no')} />
            <InputGroup label="Rev Date" type="date" {...register('rev_date')} />
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#004F8C] text-white text-xs text-center">
                <th rowSpan={2} className="border border-white/20 p-2 font-medium w-48">Name / number of process / operation description</th>
                <th rowSpan={2} className="border border-white/20 p-2 font-medium w-40">Machine, Device, Jig, Tools for Mfg.</th>
                <th colSpan={3} className="border border-white/20 p-2 font-medium">Characteristics</th>
                <th rowSpan={2} className="border border-white/20 p-2 font-medium w-12" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Special Char. Class</th>
                <th colSpan={5} className="border border-white/20 p-2 font-medium">Methods</th>
                <th rowSpan={2} className="border border-white/20 p-2 font-medium w-48">Reaction Plan</th>
                <th rowSpan={2} className="border border-white/20 p-2 font-medium w-10"></th>
              </tr>
              <tr className="bg-[#004F8C] text-white text-xs text-center">
                <th className="border border-white/20 p-2 font-medium w-10">No.</th>
                <th className="border border-white/20 p-2 font-medium w-32">Product</th>
                <th className="border border-white/20 p-2 font-medium w-32">Process</th>
                <th className="border border-white/20 p-2 font-medium w-48">Process / product specification / tolerance</th>
                <th className="border border-white/20 p-2 font-medium w-32">Evaluation/ Measurement</th>
                <th className="border border-white/20 p-2 font-medium w-20">Size</th>
                <th className="border border-white/20 p-2 font-medium w-20">Freq.</th>
                <th className="border border-white/20 p-2 font-medium w-40">Control Method</th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-gray-500 border-b border-gray-300">
                    No control points added yet. Click "Add Control Point" below.
                  </td>
                </tr>
              ) : (
                fields.map((field, index) => (
                  <tr key={field.id} className="border-b border-gray-300 hover:bg-blue-50/30 transition-colors bg-white">
                    <td className="border-r border-gray-300 p-0 align-top">
                      <div className="flex flex-col h-full">
                        <input {...register(`items.${index}.process_no`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs font-medium outline-none" placeholder="OP 40" />
                        <textarea {...register(`items.${index}.process_name`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[60px] outline-none" placeholder="Drilling" />
                      </div>
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.machine_name`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="Driller 450" />
                    </td>
                    <td className="border-r border-gray-300 p-1.5 align-top text-center text-xs text-gray-700 font-medium bg-gray-50/50">
                      {index + 1}
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.product_char`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="Diameter" />
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.process_char`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" />
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <input {...register(`items.${index}.balloon_no`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs text-center outline-none" placeholder="Class" />
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.spec`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="Acc. to drawing..." />
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.eval_method`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="CMM" />
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.sample_size`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="3pcs" />
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.sample_freq`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="2h" />
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top relative group">
                      <textarea {...register(`items.${index}.control_method`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="Coordinate measuring..." />
                      <button type="button" onClick={() => handleAISuggest(index)} className="absolute bottom-1 right-1 p-1 bg-[#004F8C]/10 text-[#004F8C] rounded opacity-0 group-hover:opacity-100 transition-opacity" title="AI Suggest">
                        {aiLoading === index ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                      </button>
                    </td>
                    <td className="border-r border-gray-300 p-0 align-top">
                      <textarea {...register(`items.${index}.reaction_plan`)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#004F8C] p-1.5 text-xs resize-none h-full min-h-[80px] outline-none" placeholder="According to Instruction..." />
                    </td>
                    <td className="p-1.5 align-middle text-center">
                      <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50/50 border-t border-gray-200">
          <button
            type="button"
            onClick={() => append({
              process_no: '', process_name: '', machine_name: '', tool_fixture: '',
              serial_no: fields.length + 1, balloon_no: '', product_char: '', process_char: '',
              spec: '', tolerance_type: '±', tolerance_value: '', upper_limit: '', lower_limit: '',
              eval_method: '', sample_size: '', sample_freq: '', control_method: '',
              responsibility: '', reaction_plan: ''
            })}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded text-[#004F8C] hover:border-[#004F8C] hover:bg-[#004F8C]/5 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Control Point
          </button>
        </div>
      </div>
    </motion.div>
  );
}
