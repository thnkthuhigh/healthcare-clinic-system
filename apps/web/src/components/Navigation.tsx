import { Link, LinkProps } from 'react-router-dom';

interface NavLinkButtonProps extends Omit<LinkProps, 'className'> {
  icon?: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button-styled navigation link with icon support
 */
export function NavLinkButton({
  icon,
  label,
  variant = 'primary',
  size = 'md',
  ...linkProps
}: NavLinkButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700',
    outline: 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <Link
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]}`}
      {...linkProps}
    >
      {icon && <span className="material-symbols-outlined text-xl">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
}

/**
 * Back button component with navigation
 */
export function BackButton({ label = 'Back', onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors group"
    >
      <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">
        arrow_back
      </span>
      <span className="text-sm font-medium group-hover:text-primary transition-colors">
        {label}
      </span>
    </button>
  );
}
