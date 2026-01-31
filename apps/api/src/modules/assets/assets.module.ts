import { Module } from "@nestjs/common";
import { AssetsService } from "./services/assets.service";

@Module({
  providers: [AssetsService],
  exports: [AssetsService]
})
export class AssetsModule{}
