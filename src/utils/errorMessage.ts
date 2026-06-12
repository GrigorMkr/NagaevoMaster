/** Сообщение из Error или запасной текст для toast и форм */
function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export {
  getErrorMessage,
}
