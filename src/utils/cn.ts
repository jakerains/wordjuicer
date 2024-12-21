// Utility function to conditionally join class names
export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}