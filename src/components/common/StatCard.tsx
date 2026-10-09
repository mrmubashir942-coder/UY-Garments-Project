import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ElementType;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
}) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-all shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-neutral-600">
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-2 text-xs text-neutral-500 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
