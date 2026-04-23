type ErrorWithCode = Error & {
  code?: string
}

const transientDbCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEOUT"])

export function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const code = (error as ErrorWithCode).code

  return (
    transientDbCodes.has(code || "") ||
    /querySrv|server selection|connection/i.test(error.message)
  )
}
