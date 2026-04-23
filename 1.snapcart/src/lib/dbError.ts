type ErrorWithCode = Error & {
  code?: string
}

const transientDbCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEOUT", "ETIMEDOUT"])

export function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const code = (error as ErrorWithCode).code

  return (
    transientDbCodes.has(code || "") ||
    /querySrv|server selection|connection|ETIMEDOUT|timed out/i.test(error.message)
  )
}
