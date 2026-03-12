import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Database, Search, Loader2 } from 'lucide-react';

export default function Library() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/library/search');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.process_step?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.function?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.potential_failure_mode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-emerald-600" />
            FMEA Knowledge Database
          </h1>
          <p className="text-gray-500 mt-1">Manage and search your process and product characteristics library.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search database..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Process Step</th>
                <th className="px-4 py-3">Function</th>
                <th className="px-4 py-3">Product Char.</th>
                <th className="px-4 py-3">Process Char.</th>
                <th className="px-4 py-3">Failure Mode</th>
                <th className="px-4 py-3">Effects</th>
                <th className="px-4 py-3 text-center">S</th>
                <th className="px-4 py-3 text-center">Class</th>
                <th className="px-4 py-3">Causes</th>
                <th className="px-4 py-3 text-center">O</th>
                <th className="px-4 py-3">Prevention</th>
                <th className="px-4 py-3">Detection</th>
                <th className="px-4 py-3 text-center">D</th>
                <th className="px-4 py-3 text-center">RPN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    Loading database...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    No entries found in the database.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const rpn = (item.severity || 0) * (item.occurrence || 0) * (item.detection || 0);
                  return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">{item.process_step}</td>
                    <td className="px-4 py-3">{item.function}</td>
                    <td className="px-4 py-3">{item.product}</td>
                    <td className="px-4 py-3">{item.process}</td>
                    <td className="px-4 py-3">{item.potential_failure_mode}</td>
                    <td className="px-4 py-3">{item.potential_effects}</td>
                    <td className="px-4 py-3 text-center font-medium">{item.severity}</td>
                    <td className="px-4 py-3 text-center">{item.class}</td>
                    <td className="px-4 py-3">{item.potential_causes}</td>
                    <td className="px-4 py-3 text-center font-medium">{item.occurrence}</td>
                    <td className="px-4 py-3">{item.current_prevention}</td>
                    <td className="px-4 py-3">{item.current_detection}</td>
                    <td className="px-4 py-3 text-center font-medium">{item.detection}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">{rpn > 0 ? rpn : ''}</td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
