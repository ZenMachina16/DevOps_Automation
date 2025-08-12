import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';

const button = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:scale-105',
  {
    variants: {
      variant: {
        default: 'bg-emerald-500 text-white hover:bg-emerald-600',
        secondary: 'bg-indigo-500 text-white hover:bg-indigo-600',
        ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
        outline: 'border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

export default function Button({ className, variant, size, ...props }) {
  return <button className={clsx(button({ variant, size }), className)} {...props} />;
}


