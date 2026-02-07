import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
// biome-ignore lint/performance/noNamespaceImport: Ignore
import * as schema from './schema'

const expoDb = openDatabaseSync('profitly.db', { enableChangeListener: true })
export const db = drizzle(expoDb, { schema })
