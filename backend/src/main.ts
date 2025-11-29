import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./bootstrap/app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  const configService = app.get(ConfigService);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
        }));
        return {
          statusCode: 400,
          message: "Validation failed",
          errors: messages,
        };
      },
    }),
  );

  const corsOrigins = configService.get<string>("CORS_ORIGINS");

  if (!corsOrigins) {
    throw new Error("CORS_ORIGINS is not set");
  }

  const allowedOrigins = corsOrigins.split(",").map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  // Graceful shutdown
  // @see https://docs.nestjs.com/fundamentals/lifecycle-events
  app.enableShutdownHooks();

  const port = configService.get<number>("PORT") || 3001;

  try {
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error}`);
    process.exit(1);
  }
}

void bootstrap();
