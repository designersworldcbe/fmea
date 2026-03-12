import React from 'react';

export const InputGroup = React.forwardRef<HTMLInputElement, { label: string, type?: string } & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ label, type = "text", ...props }, ref) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        ref={ref}
        type={type}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
        {...props}
      />
    </div>
  )
);
