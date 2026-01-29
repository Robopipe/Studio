import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@repo/database/schema';

export type DbConnection = NodePgDatabase<typeof schema, typeof schema.relations>;
