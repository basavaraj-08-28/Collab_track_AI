import React from 'react';

export const UserAvatar = ({ name = 'User', avatar, size = 'md', status = 'online' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusDotSizes = {
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-1 right-1',
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative inline-block shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover ring-2 ring-white shadow-xs`}
        />
      ) : (
        <div
          className={`${
            sizeClasses[size] || sizeClasses.md
          } rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center ring-2 ring-white shadow-xs`}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`absolute rounded-full border-2 border-white ${statusDotSizes[size] || statusDotSizes.md} ${
            status === 'online' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-500' : 'bg-slate-400'
          }`}
          title={status}
        />
      )}
    </div>
  );
};

export default UserAvatar;
