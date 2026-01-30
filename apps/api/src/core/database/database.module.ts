import { Global, Module } from "@nestjs/common";
import * as schema from "@repo/database/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppConfig } from "src/core/configuration/app.config";
import { DB_CONNECTION } from "./database.constant";

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: (config: AppConfig) => {
        const pool = new Pool({
          connectionString: config.databaseUrl,
        });

        return drizzle({ client: pool, schema });
      },
      inject: [AppConfig],
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
