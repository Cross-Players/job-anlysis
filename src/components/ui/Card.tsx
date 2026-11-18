import type { ReactNode } from 'react';

interface Props { title?: string; subtitle?: string; action?: ReactNode; className?: string; children: ReactNode }

export function Card({ title, subtitle, action, className = '', children }: Props) {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="hd">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
