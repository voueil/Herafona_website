import { Toaster as Sonner } from 'sonner';

export function SimpleToaster() {
  return (
    <Sonner
      position="top-center"
      dir="rtl"
      className="toaster group"
      toastOptions={{
        style: {
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  );
}
