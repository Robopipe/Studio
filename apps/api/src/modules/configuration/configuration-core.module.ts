import { DynamicModule, Module, Provider } from '@nestjs/common';

import { ConfigurationCoreModuleOptions } from './interfaces/configuration-core-module-options.interface';

import { appConfigSchema } from './app.config';
import { ZodError, ZodTypeAny } from 'zod';

/**
 * ConfigurationCoreModule
 * @description A module that validates and exports the configuration object as a provider.
 */
@Module({})
export class ConfigurationCoreModule {
  public static async forRootAsync(
    options: ConfigurationCoreModuleOptions,
  ): Promise<DynamicModule> {
    const config = await options.load;

    const { schema: Config, isGlobal = false, zodSchema } = options;
    const validatedConfig = this.validate(config, zodSchema);
    const provider: Provider = {
      provide: Config,
      useValue: validatedConfig,
    };

    return {
      global: isGlobal,
      module: ConfigurationCoreModule,
      providers: [provider],
      exports: [provider],
    };
  }

  /**
   * validate
   * @description Validates the configuration object using the provided schema.
   * @param rawConfig - The raw configuration object.
   * @returns The validated configuration object.
   */
  private static validate(rawConfig: unknown, zodSchema?: ZodTypeAny) {
    try {
      const schema = zodSchema ?? appConfigSchema;
      return schema.parse(rawConfig as any);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = 'Config validation failed\n';
        const formattedErrors = this.parseValidationErrors(error);
        throw new Error(errorMessage + formattedErrors.join('\n'));
      }
      throw error;
    }
  }

  /**
   * parseValidationErrors
   * @description Parses the validation errors into a more human readable format.
   * @param errors - The Zod validation errors.
   * @returns An array of strings containing the formatted validation errors.
   */
  private static parseValidationErrors(error: ZodError<any>) {
    return error.issues.map(
      (err) =>
        `Property "${err.path.join('.')}" failed: ${err.message} (received value: ${JSON.stringify(err)})`,
    );
  }
}
