import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/core/database/services/database.service";

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DatabaseService){}
}
