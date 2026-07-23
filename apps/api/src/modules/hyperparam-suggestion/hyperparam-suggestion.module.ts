import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { HyperparamSuggestionController } from "./controllers/hyperparam-suggestion.controller";
import { GeminiClientService } from "./services/gemini-client.service";
import { HyperparamSuggestionService } from "./services/hyperparam-suggestion.service";

@Module({
  imports: [AssetsModule],
  providers: [HyperparamSuggestionService, GeminiClientService],
  controllers: [HyperparamSuggestionController],
})
export class HyperparamSuggestionModule {}
