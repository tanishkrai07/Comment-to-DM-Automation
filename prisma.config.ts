import dotenv from 'dotenv'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Prisma CLI doesn't auto-load .env.local before evaluating this config,
// so we must explicitly load it.
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  }
})
