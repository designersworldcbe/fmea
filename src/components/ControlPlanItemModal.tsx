import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { ControlPlanItem } from '../types';
import { suggestControlPlanDetails } from '../services/gemini';

interface Props {
  isOpen: boolean;
  initialData?: Partial<ControlPlanItem>;
  onClose: () => void;
  onSave: (data: ControlPlanItem, keepOpen?: boolean) => void;
}

export default function ControlPlanItemModal({ isOpen, initialData, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<Partial<ControlPlanItem>>({});
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { tolerance_type: '±' });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ControlPlanItem, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (['spec', 'tolerance_value', 'tolerance_type'].includes(field)) {
        const spec = parseFloat(updated.spec || '0');
        const tolVal = parseFloat(updated.tolerance_value || '0');
        const tolType = updated.tolerance_type || '±';

        if (!isNaN(spec) && !isNaN(tolVal)) {
          let upper = '';
          let lower = '';
          switch (tolType) {
            case '±':
              upper = (spec + tolVal).toFixed(3);
              lower = (spec - tolVal).toFixed(3);
              break;
            case '+':
              upper = (spec + tolVal).toFixed(3);
              lower = spec.toFixed(3);
              break;
            case '-':
              upper = spec.toFixed(3);
              lower = (spec - tolVal).toFixed(3);
              break;
            case 'GD&T':
              upper = (spec + tolVal).toFixed(3);
              lower = spec.toFixed(3);
              break;
          }
          updated.upper_limit = upper;
          updated.lower_limit = lower;
        }
      }
      return updated;
    });
  };

  const handleAISuggest = async () => {
    if (!formData.product_char || !formData.process_char) {
      alert('Please enter Product and Process characteristics first.');
      return;
    }
    setAiLoading(true);
    try {
      const suggestion = await suggestControlPlanDetails(
        formData.product_char, 
        formData.process_char, 
        formData.spec || ''
      );
      setFormData(prev => ({ ...prev, ...suggestion }));
    } catch (e) {
      console.error(e);
      alert('AI Suggestion failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = () => {
    onSave(formData as ControlPlanItem, false);
  };

  const handleSaveAndAddAnother = () => {
    onSave(formData as ControlPlanItem, true);
    setFormData(prev => ({
      process_no: prev.process_no,
      process_name: prev.process_name,
      machine_name: prev.machine_name,
      tool_fixture: prev.tool_fixture,
      serial_no: (Number(prev.serial_no) || 0) + 1,
      tolerance_type: '±'
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            {initialData?.id || initialData?.process_no ? 'Edit Control Point' : 'Add Control Point'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Process Details */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Process Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormInput label="Process No" value={formData.process_no} onChange={(v: string) => handleChange('process_no', v)} />
              <FormInput label="Process Name" value={formData.process_name} onChange={(v: string) => handleChange('process_name', v)} className="md:col-span-3" />
              <FormInput label="Machine" value={formData.machine_name} onChange={(v: string) => handleChange('machine_name', v)} className="md:col-span-2" />
              <FormInput label="Tool/Fixture" value={formData.tool_fixture} onChange={(v: string) => handleChange('tool_fixture', v)} className="md:col-span-2" />
            </div>
          </section>

          {/* Characteristics */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Characteristics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4">
                <FormInput label="Serial No" value={formData.serial_no} onChange={(v: string) => handleChange('serial_no', v)} type="number" className="w-1/3" />
                <FormInput label="Balloon No" value={formData.balloon_no} onChange={(v: string) => handleChange('balloon_no', v)} className="w-2/3" />
              </div>
              <div className="hidden md:block"></div>
              <FormTextarea label="Product Characteristic" value={formData.product_char} onChange={(v: string) => handleChange('product_char', v)} />
              <FormTextarea label="Process Characteristic" value={formData.process_char} onChange={(v: string) => handleChange('process_char', v)} />
            </div>
          </section>

          {/* Specifications */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Specifications & Tolerances</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <FormInput label="Specification" value={formData.spec} onChange={(v: string) => handleChange('spec', v)} className="md:col-span-2" />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tol Type</label>
                <select 
                  value={formData.tolerance_type || '±'}
                  onChange={(e) => handleChange('tolerance_type', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#0A6ED1] focus:border-[#0A6ED1] outline-none"
                >
                  <option value="±">± (Plus/Minus)</option>
                  <option value="+">+ (Plus Only)</option>
                  <option value="-">- (Minus Only)</option>
                  <option value="GD&T">GD&T</option>
                </select>
              </div>
              <FormInput label="Tol Value" value={formData.tolerance_value} onChange={(v: string) => handleChange('tolerance_value', v)} />
              <div className="flex flex-col justify-center space-y-1 bg-gray-50 p-2 rounded border border-gray-100">
                <div className="text-xs flex justify-between"><span className="text-gray-500">Upper:</span> <span className="font-mono text-emerald-600 font-medium">{formData.upper_limit || '-'}</span></div>
                <div className="text-xs flex justify-between"><span className="text-gray-500">Lower:</span> <span className="font-mono text-red-600 font-medium">{formData.lower_limit || '-'}</span></div>
              </div>
            </div>
          </section>

          {/* Control Methods */}
          <section>
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
              <h4 className="text-sm font-semibold text-gray-700">Control Methods</h4>
              <button 
                onClick={handleAISuggest}
                disabled={aiLoading}
                className="text-xs font-medium text-[#0A6ED1] hover:text-[#0854A0] flex items-center gap-1 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                AI Suggest Methods
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextarea label="Evaluation Method" value={formData.eval_method} onChange={(v: string) => handleChange('eval_method', v)} />
              <FormTextarea label="Control Method" value={formData.control_method} onChange={(v: string) => handleChange('control_method', v)} />
              <div className="flex gap-4">
                <FormInput label="Sample Size" value={formData.sample_size} onChange={(v: string) => handleChange('sample_size', v)} className="flex-1" />
                <FormInput label="Sample Freq" value={formData.sample_freq} onChange={(v: string) => handleChange('sample_freq', v)} className="flex-1" />
              </div>
            </div>
          </section>

          {/* Reaction */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Reaction Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput label="Responsibility" value={formData.responsibility} onChange={(v: string) => handleChange('responsibility', v)} />
              <FormTextarea label="Reaction Plan" value={formData.reaction_plan} onChange={(v: string) => handleChange('reaction_plan', v)} className="md:col-span-2" />
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSaveAndAddAnother} className="px-4 py-2 bg-white border border-[#0A6ED1] text-[#0A6ED1] rounded hover:bg-[#EBF8FE] transition-colors text-sm font-medium">
            Save & Add Another
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-[#0A6ED1] text-white rounded hover:bg-[#0854A0] transition-colors text-sm font-medium">
            Save Control Point
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', className = '' }: any) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#0A6ED1] focus:border-[#0A6ED1] outline-none transition-all"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, className = '' }: any) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#0A6ED1] focus:border-[#0A6ED1] outline-none transition-all resize-none h-16"
      />
    </div>
  );
}
