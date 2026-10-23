import React from 'react';
import { Loader } from 'lucide-react';

export default function PageLoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: '400px',
      color: 'var(--color-accent-blue)',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Loader className="animate-spin" size={40} />
      <div style={{
        fontSize: '0.9rem',
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.05em'
      }}>
        LOADING MODULE
      </div>
    </div>
  );
}
