import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AppConfig } from "./core/configuration/app.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  const config = app.get(AppConfig);
  const documentConfig = new DocumentBuilder()
    .setTitle("Robopipe Studio API")
    .setDescription("The Robopipe Studio API documentation")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup("doc", app, document);

  app.use(cookieParser(config.cookieSecret));
  app.enableCors({
    origin: [config.webHost, config.apiHost, 'http://localhost:5173'],
    credentials: true,
  });

  await app.listen(
    config.port ?? 3000,
    config.host ?? "localhost",
  );
}

void bootstrap();
