import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { ProjectGuard } from "../../auth/guards/project-guard";
import {
  SuggestHyperparamsRequestDto,
  SuggestHyperparamsResponseDto,
} from "../dto/hyperparam-suggestion.dto";
import { HyperparamSuggestionService } from "../services/hyperparam-suggestion.service";

@Controller("hyperparam-suggestion/:projectId")
@UseGuards(ProjectGuard)
export class HyperparamSuggestionController {
  constructor(
    private readonly hyperparamSuggestionService: HyperparamSuggestionService,
  ) {}

  @Post()
  public async suggest(
    @ProjectId() projectId: number,
    @Body() data: SuggestHyperparamsRequestDto,
  ): Promise<SuggestHyperparamsResponseDto> {
    return this.hyperparamSuggestionService.suggest(projectId, data);
  }
}
