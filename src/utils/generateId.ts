export function generateId(): string {
  try {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  } catch (error) {
    console.error('Error generating ID:', error);
    // Fallback ID generation
    return 'id_' + Math.random().toString(36).substr(2, 12);
  }
}