import { integer, uuid, varchar } from 'drizzle-orm/pg-core';
import {v7 as uuidv7} from 'uuid'

export const id = integer().primaryKey().generatedAlwaysAsIdentity();
export const uuidId = varchar('id', {length: 128}).primaryKey().$defaultFn(() => uuidv7()) // UUID7 supported natively in Postgres18+
