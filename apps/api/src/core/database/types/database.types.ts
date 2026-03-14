import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@repo/database/schema';
import relations from '@repo/database/schema/relations/index'

export type DbConnection = NodePgDatabase<typeof schema, typeof relations>;
