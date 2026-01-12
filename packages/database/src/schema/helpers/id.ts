import { integer } from 'drizzle-orm/pg-core';

export const id = integer().primaryKey().generatedAlwaysAsIdentity();
