import type { ClassConstructor } from 'class-transformer';

/**
 * ConfigurationCoreModuleOptions
 * @description The options for the configuration core module.
 * @property schema - The class that is used as a schema to validate the configuration and is instntiated to create the configuration object.
 * @property load - The promise that loads the configuration.
 * @property isGlobal - A boolean that determines if the module is global or not.
 */
export interface ConfigurationCoreModuleOptions {
  schema: ClassConstructor<any>;
  load: Promise<Record<string, any>>;
  isGlobal?: boolean;
}
