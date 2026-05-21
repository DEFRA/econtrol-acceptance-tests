const ENV_PLACEHOLDER_PATTERN = /^\$\{([A-Z0-9_]+)\}$/

export const resolveEnvPlaceholders = (value) => {
  if (Array.isArray(value)) {
    return value.map(resolveEnvPlaceholders)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        resolveEnvPlaceholders(entryValue)
      ])
    )
  }

  if (typeof value !== 'string') {
    return value
  }

  const match = value.match(ENV_PLACEHOLDER_PATTERN)

  if (!match) {
    return value
  }

  const [, envName] = match
  const envValue = process.env[envName]

  if (envValue === undefined || envValue === '') {
    throw new Error(
      `Environment variable ${envName} is required for feature value ${value}.`
    )
  }

  return envValue
}
