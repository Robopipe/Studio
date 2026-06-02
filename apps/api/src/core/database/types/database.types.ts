import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@repo/database/schema';
import relations from '@repo/database/schema/relations/index'

export type DbConnection = NodePgDatabase<typeof schema, typeof relations>;
export type DbTransaction = Parameters<Parameters<DbConnection['transaction']>[0]>[0];
