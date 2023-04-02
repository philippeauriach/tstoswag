import fs from 'fs'
import { extname } from 'node:path'

import { Tsoa } from '@tsoa/runtime'
import * as ts from 'typescript'
import type { CompilerOptions } from 'typescript'

import { Config } from './config'
import { MetadataGenerator } from './metadataGenerator'
import { SpecGenerator3 } from './specGenerator3'
import { ExtendedSpecConfig } from './types'

export const getSwaggerOutputPath = (swaggerConfig: ExtendedSpecConfig) => {
  const specFileBaseName = swaggerConfig.specFileBaseName || 'swagger'

  return `${swaggerConfig.outputDirectory}/${specFileBaseName}.json`
}

export const generateSpec = async (
  swaggerConfig: ExtendedSpecConfig,
  compilerOptions?: ts.CompilerOptions,
  ignorePaths?: string[],
  /**
   * pass in cached metadata returned in a previous step to speed things up
   */
  metadata?: Tsoa.Metadata,
) => {
  if (!metadata) {
    metadata = new MetadataGenerator(
      swaggerConfig.entryFile,
      compilerOptions,
      ignorePaths,
      swaggerConfig.controllerPathGlobs,
      swaggerConfig.rootSecurity,
    ).Generate()
  }

  const spec = new SpecGenerator3(metadata, swaggerConfig).GetSpec()

  fs.mkdirSync(swaggerConfig.outputDirectory, { recursive: true })

  const data = JSON.stringify(spec, null, '\t')

  const outputPath = getSwaggerOutputPath(swaggerConfig)
  console.log('Writing swagger definition to: ', outputPath)
  fs.writeFileSync(outputPath, data, { encoding: 'utf8' })

  return metadata
}

const workingDir: string = process.cwd()

const getConfig = async (configPath = 'tsoa.json'): Promise<Config> => {
  let config: Config
  const ext = extname(configPath)
  try {
    if (ext === '.js') {
      config = await import(`${workingDir}/${configPath}`)
    } else {
      const configRaw = fs.readFileSync(`${workingDir}/${configPath}`)
      config = JSON.parse(configRaw.toString('utf8'))
    }
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw Error(`No config file found at '${configPath}'`)
    } else if (err.name === 'SyntaxError') {
      // eslint-disable-next-line no-console
      console.error(err)
      const errorType = ext === '.js' ? 'JS' : 'JSON'
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw Error(`Invalid ${errorType} syntax in config at '${configPath}': ${err.message}`)
    } else {
      // eslint-disable-next-line no-console
      console.error(err)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw Error(`Unhandled error encountered loading '${configPath}': ${err.message}`)
    }
  }

  return config
}

const resolveConfig = async (config?: string | Config): Promise<Config> => {
  return typeof config === 'object' ? config : getConfig(config)
}

const validateCompilerOptions = (config?: Record<string, unknown>): CompilerOptions => {
  return (config || {}) as CompilerOptions
}

const determineNoImplicitAdditionalSetting = (
  noImplicitAdditionalProperties: Config['noImplicitAdditionalProperties'],
): Exclude<Config['noImplicitAdditionalProperties'], undefined> => {
  if (
    noImplicitAdditionalProperties === 'silently-remove-extras' ||
    noImplicitAdditionalProperties === 'throw-on-extras' ||
    noImplicitAdditionalProperties === 'ignore'
  ) {
    return noImplicitAdditionalProperties
  } else {
    return 'ignore'
  }
}

export const validateSpecConfig = async (config: Config): Promise<ExtendedSpecConfig> => {
  if (!config.spec) {
    throw new Error(
      'Missing spec: configuration must contain spec. Spec used to be called swagger in previous versions of tsoa.',
    )
  }
  if (!config.spec.outputDirectory) {
    throw new Error('Missing outputDirectory: configuration must contain output directory.')
  }
  if (!config.entryFile && !config.controllerPathGlobs?.length) {
    throw new Error(
      'Missing entryFile and controllerPathGlobs: Configuration must contain an entry point file or controller path globals.',
    )
  }
  if (!!config.entryFile && !(await fs.existsSync(config.entryFile))) {
    throw new Error(`EntryFile not found: ${config.entryFile} - please check your tsoa config.`)
  }
  config.spec.version = config.spec.version || '1.0.0'

  config.spec.specVersion = config.spec.specVersion || 2
  if (config.spec.specVersion !== 2 && config.spec.specVersion !== 3) {
    throw new Error('Unsupported Spec version.')
  }

  if (config.spec.spec && !['immediate', 'recursive', 'deepmerge', undefined].includes(config.spec.specMerging)) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid specMerging config: ${config.spec.specMerging}`)
  }

  const noImplicitAdditionalProperties = determineNoImplicitAdditionalSetting(config.noImplicitAdditionalProperties)
  config.spec.name = config.spec.name || 'My API'
  config.spec.description = config.spec.description || 'My API description'
  config.spec.license = config.spec.license || 'My License'
  config.spec.basePath = config.spec.basePath || '/'
  // defaults to template that may generate non-unique operation ids.
  // @see https://github.com/lukeautry/tsoa/issues/1005
  config.spec.operationIdTemplate = config.spec.operationIdTemplate || '{{titleCase method.name}}'

  if (!config.spec.contact) {
    config.spec.contact = {}
  }

  if (config.spec.rootSecurity) {
    if (!Array.isArray(config.spec.rootSecurity)) {
      throw new Error('spec.rootSecurity must be an array')
    }

    if (config.spec.rootSecurity) {
      const ok = config.spec.rootSecurity.every(
        (security) =>
          typeof security === 'object' &&
          security !== null &&
          Object.values(security).every((scope) => Array.isArray(scope)),
      )

      if (!ok) {
        throw new Error(
          'spec.rootSecurity must be an array of objects whose keys are security scheme names and values are arrays of scopes',
        )
      }
    }
  }

  return {
    ...config.spec,
    noImplicitAdditionalProperties,
    entryFile: config.entryFile,
    controllerPathGlobs: config.controllerPathGlobs,
  }
}

export const runSpecGeneration = async (args: {
  configuration?: string | Config
  basePath?: string
  host?: string
}) => {
  try {
    const config = await resolveConfig(args.configuration)
    if (args.basePath) {
      config.spec.basePath = args.basePath
    }
    if (args.host) {
      config.spec.host = args.host
    }

    const compilerOptions = validateCompilerOptions(config.compilerOptions)
    const swaggerConfig = await validateSpecConfig(config)

    await generateSpec(swaggerConfig, compilerOptions, config.ignore)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Generate swagger error.\n', err)
    process.exit(1)
  }
}
