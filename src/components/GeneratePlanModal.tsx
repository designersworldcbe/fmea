import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Sparkles, Loader2, X } from 'lucide-react';
import { ControlPlanItem } from '../types';

interface ProcessInput {
  processName: string;
  productChar: string;
  processChar: string;
  spec: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (items: ControlPlanItem[]) => void;
  partName: string;
}

export default function GeneratePlanModal({ isOpen, onClose, onGenerate, partName }: Props) {
  const [operationName, setOperationName] = useState('');
  const [processes, setProcesses] = useState<ProcessInput[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ProcessInput>({
    processName: '',
    productChar: '',
    processChar: '',
    spec: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAddProcess = () => {
    if (!currentProcess.processName || !currentProcess.productChar) {
      alert('Please enter Process Name and Product Characteristic.');
      return;
    }
    setProcesses([...processes, currentProcess]);
    setCurrentProcess({ processName: '', productChar: '', processChar: '', spec: '' });
  };

  const handleGenerate = async () => {
    if (!operationName || processes.length === 0) {
      alert('Please enter Operation Name and add at least one process.');
      return;
    }
    setLoading(true);
    try {
      const { generateFullControlPlan } = await import('../services/gemini');
      const items = await generateFullControlPlan(partName, processes);
      onGenerate(items);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to generate full plan.');
    } finally {
      setLoading(false);
    }
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
            <h3 className="text-lg font-bold text-gray-900">Generate Full Control Plan</h3>
            <p className="text-sm text-gray-500">Define operation and add processes</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Operation Name</label>
            <input
              value={operationName}
              onChange={(e) => setOperationName(e.target.value)}
              placeholder="e.g. Machining Operation"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Add Process</h4>
            <div className="grid grid-cols-5 gap-2">
              <input
                value={currentProcess.processName}
                onChange={(e) => setCurrentProcess({...currentProcess, processName: e.target.value})}
                placeholder="Process Name"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <input
                value={currentProcess.productChar}
                onChange={(e) => setCurrentProcess({...currentProcess, productChar: e.target.value})}
                placeholder="Product Char"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <input
                value={currentProcess.processChar}
                onChange={(e) => setCurrentProcess({...currentProcess, processChar: e.target.value})}
                placeholder="Process Char"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <input
                value={currentProcess.spec}
                onChange={(e) => setCurrentProcess({...currentProcess, spec: e.target.value})}
                placeholder="Spec"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <button
                onClick={handleAddProcess}
                className="bg-gray-800 text-white rounded-lg font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {processes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Added Processes</h4>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-left">Process</th>
                      <th className="p-2 text-left">Product Char</th>
                      <th className="p-2 text-left">Process Char</th>
                      <th className="p-2 text-left">Spec</th>
                      <th className="p-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((p, i) => (
                      <tr key={i} className="bg-white border-t border-gray-100">
                        <td className="p-2">{p.processName}</td>
                        <td className="p-2">{p.productChar}</td>
                        <td className="p-2">{p.processChar}</td>
                        <td className="p-2">{p.spec}</td>
                        <td className="p-2 text-center">
                          <button onClick={() => setProcesses(processes.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            onClick={handleGenerate}
            disabled={loading || processes.length === 0}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generate Plan
          </button>
        </div>
      </motion.div>
    </div>
  );
}
