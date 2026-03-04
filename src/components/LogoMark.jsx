import React from 'react';
import clsx from 'clsx';
import TGHLogo from '../assets/TGH.png';

export default function LogoMark({ className }) {
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center',
        className
      )}
    >
      <img
        src={TGHLogo}
        alt="TGH - Thara Global Holdings"
        className="h-12 w-auto object-contain"
      />
    </div>
  );
}

