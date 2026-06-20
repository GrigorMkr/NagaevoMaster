function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

function asArray<T>(value: unknown, fallback: T[] = []): T[] {
  return isArray<T>(value) ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isJsonApiResponse(data: unknown): boolean {
  if (typeof data === 'string') {
    const trimmed = data.trimStart()
    return trimmed.startsWith('<!') || trimmed.startsWith('<html')
  }
  return false
}

export {
  asArray,
  isArray,
  isJsonApiResponse,
  isRecord,
}
