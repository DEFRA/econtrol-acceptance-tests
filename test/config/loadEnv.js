import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

export const loadEnv = (defaultEnv = 'dev') => {
  const env = process.env.TEST_ENV || defaultEnv

  process.env.TEST_ENV = env

  dotenv.config({
    path: path.join(projectRoot, `.env.${env}`)
  })

  return env
}
