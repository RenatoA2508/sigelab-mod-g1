export class AppError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function userMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  return 'No pudimos completar la operación. Revisa tu conexión e inténtalo de nuevo.'
}
