import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ClipboardList, ChevronRight, Search, Filter, Loader2 } from 'lucide-react';
import { ControlPlan } from '../types';
import ControlPlanEditor from '../components/ControlPlanEditor';

export default function ControlPlanList() {
  const [controlPlans, setControlPlans] = useState<ControlPlan[]>([]);
  const [currentControlPlan, setCurrentControlPlan] = useState<ControlPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchControlPlans();
  }, []);

  const fetchControlPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/control-plans');
      if (!res.ok) throw new Error('Failed to fetch Control Plans');
      const data = await res.json();
      setControlPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setControlPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newPlan: ControlPlan = {
      id: 0,
      draw_no: '',
      part_name: '',
      customer_name: '',
      process_responsibility: '',
      key_review_date: '',
      cp_no: '',
      date: new Date().toISOString().split('T')[0],
      rev_no: '00',
      rev_date: new Date().toISOString().split('T')[0],
      prepared_by: '',
      reviewed_by: '',
      approved_by: '',
      items: [],
      created_at: '',
      updated_at: ''
    };
    setCurrentControlPlan(newPlan);
  };

  const handleEdit = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/control-plans/${id}`);
      if (!res.ok) throw new Error('Failed to fetch Control Plan');
      const data = await res.json();
      setCurrentControlPlan(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Control Plan?')) return;
    try {
      await fetch(`/api/control-plans/${id}`, { method: 'DELETE' });
      fetchControlPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (data: ControlPlan) => {
    setIsSaving(true);
    try {
      let cpId = data.id;
      if (cpId === 0) {
        const res = await fetch('/api/control-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create Control Plan');
        const result = await res.json();
        cpId = result.id;
      } else {
        const res = await fetch(`/api/control-plans/${cpId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update Control Plan');
      }

      if (data.items) {
        for (const item of data.items) {
          if (item.id) {
            await fetch(`/api/control-plan-items/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
          } else {
            await fetch(`/api/control-plans/${cpId}/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
          }
        }
      }

      if (data.id === 0) handleEdit(cpId);
      fetchControlPlans();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPlans = controlPlans.filter(p => 
    p.part_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.cp_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (currentControlPlan) {
    return (
      <ControlPlanEditor
        plan={currentControlPlan}
        onSave={handleSave}
        onBack={() => setCurrentControlPlan(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search Control Plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0A6ED1] focus:border-[#0A6ED1] outline-none transition-all text-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-[#0A6ED1] px-4 py-2 rounded font-medium hover:bg-gray-50 transition-all text-sm flex-1 md:flex-none">
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-[#0A6ED1] hover:bg-[#0854A0] text-white px-4 py-2 rounded font-medium transition-all text-sm flex-1 md:flex-none shadow-sm"
          >
            <Plus size={16} />
            Create
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-normal">CP No</th>
                <th className="px-6 py-3 font-normal">Part Name</th>
                <th className="px-6 py-3 font-normal">Customer</th>
                <th className="px-6 py-3 font-normal">Last Updated</th>
                <th className="px-6 py-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-[#0A6ED1] mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ClipboardList size={48} strokeWidth={1} className="mx-auto mb-3 text-gray-300" />
                    <p>No Control Plans found.</p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr 
                    key={plan.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleEdit(plan.id)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {plan.cp_no || '-'}
                    </td>
                    <td className="px-6 py-4 text-[#0A6ED1] group-hover:underline">
                      {plan.part_name || 'Untitled Part'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {plan.customer_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(plan.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan.id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
