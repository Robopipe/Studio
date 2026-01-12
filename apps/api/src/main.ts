import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AppConfig } from "./core/configuration/app.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  const config = app.get(AppConfig);
  const documentConfig = new DocumentBuilder()
    .setTitle("Robopipe Studio API")
    .setDescription("The Robopipe Studio API documentation")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup("api", app, document);

  await app.listen(
    config.server?.port ?? 3000,
    config.server?.host ?? "localhost",
  );
}

void bootstrap();
