export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeEmail(input: string): string {
  const sanitized = sanitizeString(input);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized.toLowerCase();
}

export function sanitizePhone(input: string): string {
  const sanitized = input.replace(/[^\d\s\-\+\(\)]/g, '').trim();
  
  if (sanitized.length < 10) {
    throw new Error('Phone number too short');
  }
  
  return sanitized;
}

export function sanitizeName(input: string): string {
  const sanitized = sanitizeString(input);
  
  if (sanitized.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }
  
  if (sanitized.length > 100) {
    throw new Error('Name must be less than 100 characters');
  }
  
  return sanitized;
}

export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, char => map[char] || char);
}
