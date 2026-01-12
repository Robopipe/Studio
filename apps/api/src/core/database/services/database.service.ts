import { Injectable, Logger } from "@nestjs/common";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { AppConfig } from "src/core/configuration/app.config";
import * as schema from "@repo/database/schema/index";

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  public readonly db: NodePgDatabase<typeof schema>;

  constructor(private readonly configService: AppConfig) {
    const pool = new Pool({
      connectionString: this.configService.databaseUrl,
    });

    this.db = drizzle(pool, { schema });
  }

  async migrate() {
    this.logger.log("Running database migrations...");
    await migrate(this.db, { migrationsFolder: "drizzle" });
    this.logger.log("Database migrations completed");
  }
}
