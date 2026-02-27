import imageCompression from 'browser-image-compression';

/**
 * Generate a unique 9-digit ID in XXX-XXX-XXX format
 */
export function generateUniqueId(): string {
  const digits = () => Math.floor(100 + Math.random() * 900).toString();
  return `${digits()}-${digits()}-${digits()}`;
}

/**
 * Format a unique ID string
 */
export function formatUniqueId(raw: string): string {
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length !== 9) return raw;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}`;
}

/**
 * Validate XXX-XXX-XXX format
 */
export function isValidUniqueId(id: string): boolean {
  return /^\d{3}-\d{3}-\d{3}$/.test(id);
}

/**
 * Compress image before upload — saves data for Bangladeshi users
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/webp',
  };
  return imageCompression(file, options);
}

/**
 * Format timestamp for display
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString('en-BD', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
  }
}

/**
 * Debounce utility
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
