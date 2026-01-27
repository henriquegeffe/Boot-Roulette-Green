
import React from 'react';

// Added optional children to satisfy compiler in some environments where JSX children detection might fail
export const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border shadow-sm ${className}`}>{children}</div>
);

// Added optional children to satisfy compiler in some environments where JSX children detection might fail
export const CardHeader = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

// Added optional children to satisfy compiler in some environments where JSX children detection might fail
export const CardTitle = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-bold leading-none tracking-tight ${className}`}>{children}</h3>
);

// Added optional children to satisfy compiler in some environments where JSX children detection might fail
export const CardDescription = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <p className={`text-sm text-slate-400 ${className}`}>{children}</p>
);

// Added optional children to satisfy compiler in some environments where JSX children detection might fail
export const CardContent = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`p-4 pt-0 ${className}`}>{children}</div>
);

export const Button = ({ children, onClick, className = "", variant = "primary", disabled = false }: any) => {
  const variants: any = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white",
    outline: "border border-slate-700 hover:bg-slate-800 text-slate-300",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "hover:bg-slate-800 text-slate-300",
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, className = "", variant = "default" }: any) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm ring-offset-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`}
  />
);

export const Select = ({ children, value, onValueChange, className = "" }: any) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
    >
      {children}
    </select>
  );
};

export const Table = ({ children }: any) => (
  <div className="relative w-full overflow-auto">
    <table className="w-full caption-bottom text-sm">{children}</table>
  </div>
);

export const TableHeader = ({ children }: any) => <thead className="[&_tr]:border-b border-slate-700">{children}</thead>;
export const TableBody = ({ children }: any) => <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
export const TableRow = ({ children, className = "" }: any) => (
  <tr className={`border-b border-slate-700 transition-colors hover:bg-slate-800/50 ${className}`}>{children}</tr>
);
export const TableHead = ({ children, className = "" }: any) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-slate-400 ${className}`}>{children}</th>
);
export const TableCell = ({ children, className = "" }: any) => (
  <td className={`p-4 align-middle ${className}`}>{children}</td>
);
