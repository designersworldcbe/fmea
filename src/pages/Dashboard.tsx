import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileSpreadsheet, ClipboardList, AlertTriangle, CheckCircle2, ChevronRight, Database } from 'lucide-react';
import { FMEA, ControlPlan } from '../types';

export default function Dashboard() {
  const [fmeas, setFmeas] = useState<FMEA[]>([]);
  const [controlPlans, setControlPlans] = useState<ControlPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/fmeas').then(res => res.ok ? res.json() : []).then(data => Array.isArray(data) ? data : []),
      fetch('/api/control-plans').then(res => res.ok ? res.json() : []).then(data => Array.isArray(data) ? data : [])
    ]).then(([fmeaData, cpData]) => {
      setFmeas(fmeaData);
      setControlPlans(cpData);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const stats = [
    { label: 'Total PFMEAs', value: fmeas.length, icon: FileSpreadsheet, color: 'text-[#0A6ED1]', bg: 'bg-[#EBF8FE]', path: '/fmeas' },
    { label: 'Total Control Plans', value: controlPlans.length, icon: ClipboardList, color: 'text-[#D04343]', bg: 'bg-[#FDEBEE]', path: '/control-plans' },
    { label: 'Knowledge Base Items', value: 'Library', icon: Database, color: 'text-[#107E3E]', bg: 'bg-[#E7F4E4]', path: '/library' },
    { label: 'High Risks (RPN > 100)', value: 12, icon: AlertTriangle, color: 'text-[#E9730C]', bg: 'bg-[#FEF0E0]', path: '/fmeas' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-normal text-gray-800">Overview</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => window.location.href = stat.path}
            className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-36"
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-normal text-gray-600 leading-tight">{stat.label}</p>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="mt-auto">
              <p className="text-4xl font-light text-gray-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-base font-normal text-gray-800">Recent PFMEAs</h3>
            <button className="text-sm text-[#0A6ED1] hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {fmeas.slice(0, 5).map(fmea => (
              <div key={fmea.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#EBF8FE] rounded flex items-center justify-center text-[#0A6ED1]">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#0A6ED1] transition-colors">{fmea.part_name || 'Untitled Part'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmea.fmea_no || 'No FMEA No'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-800">{new Date(fmea.updated_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Updated</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
            {fmeas.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500 text-sm">No PFMEAs found.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-base font-normal text-gray-800">Recent Control Plans</h3>
            <button className="text-sm text-[#0A6ED1] hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {controlPlans.slice(0, 5).map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FDEBEE] rounded flex items-center justify-center text-[#D04343]">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#0A6ED1] transition-colors">{plan.part_name || 'Untitled Part'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.cp_no || 'No CP No'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-800">{new Date(plan.updated_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Updated</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
            {controlPlans.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500 text-sm">No Control Plans found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
