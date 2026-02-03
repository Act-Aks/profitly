import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    dialect: 'sqlite',
    driver: 'expo',
    out: './src/utils/database/drizzle',
    schema: './src/utils/database/schema.ts',
})
