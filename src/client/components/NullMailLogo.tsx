import React from 'react';

interface NullMailLogoProps {
  subtitle?: string;
}

const NullMailLogo: React.FC<NullMailLogoProps> = ({ subtitle }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/brand-mark.svg"
        alt=""
        aria-hidden="true"
        className="h-11 w-11 rounded-2xl shadow-lg shadow-indigo-200/80"
      />
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-gray-900">NullMail</span>
        {subtitle ? (
          <span className="text-sm font-mono text-indigo-600/80">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
};

export default NullMailLogo;
