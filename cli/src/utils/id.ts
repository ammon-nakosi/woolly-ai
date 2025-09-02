export function generateId(length: number = 4): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 2 + length);
  return `${timestamp}_${random}`;
}