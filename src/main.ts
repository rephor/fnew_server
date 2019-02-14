import { NestFactory } from '@nestjs/core'
import { ApplicationModule } from './service/app.module'
import { join } from 'path'
import { HttpExceptionFilter } from './service/http-exception.filter'
import { configure, getLogger } from 'log4js'
import { config } from './common/config'
import { version } from './common/version'
import { init } from './service/common/memory.db'

const logger = getLogger('main')

async function bootstrap() {
    configure('config/log4js.json')

    logger.info('start with version', version, 'config', config)

    const app = await NestFactory.create(ApplicationModule)
    app.useStaticAssets(join(__dirname, '..', 'public'))

    for (const key in config.static.assert) {
        if (!config.static.assert.hasOwnProperty(key)) {
            continue
        }

        app.useStaticAssets(join(__dirname, '..', key), {prefix: config.static.assert[key]})
    }

    app.useGlobalFilters(new HttpExceptionFilter(config.static.refresh))
    app.setGlobalPrefix('service')
    init()
    await app.listen(config.static.port)
}

void bootstrap()
