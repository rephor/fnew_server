import { Injectable } from '@nestjs/common'
import { getLogger } from 'log4js'
import { Config } from '../../common/define'
import { getConfig } from '../../common/config'
import { getSetting, setConfig } from '../common/memory.db'

const logger = getLogger ( 'config' )
const showId = getConfig ( 'showId' )

@Injectable ()
export class ConfigService {

    getSetting = () => {
        logger.info('ConfigService getSetting ')
        return getSetting()
    }

    setConfig = ( config: Config): string => {
        logger.info('ConfigService setConfig start config = ', config)
        setConfig(config)
        logger.info('ConfigService setConfig end  ')
        return 'ok'
    }

    isShowId = (): boolean => {
        logger.info('ConfigService isShowId showId = ', showId)
        return showId === true
    }

}