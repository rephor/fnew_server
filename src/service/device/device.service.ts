import { Injectable } from '@nestjs/common'
import { Device } from '../model/model'
import { changeDevice, checkExist, getDeviceById, getDevices, removeDevice, saveDevice } from '../common/memory.db'
import { getLogger } from 'log4js'
import { getDeviceId, rollback, upgrade } from '../../sbi/protocol'

const logger = getLogger ( 'device' )

@Injectable ()
export class DeviceService {

    add = ( device: Device ): string => {
        logger.info('DeviceService add start ', device)

        if ( device.id.length !== 5 )
            return '设备ID长度限定为5'
        else if ( checkExist ( device.id ) )
            return '设备ID已存在'

        saveDevice ( device )

        logger.info('DeviceService add success')
        return 'ok'
    }

    update = ( id: string, device: Device ): string => {
        logger.info('DeviceService update start ', device)

        const devices = getDevices ()

        if ( !checkExist ( id ) )
            return '该设备不存在'
        else if ( id !== device.id && checkExist ( device.id ) )
            return '修改后ID已存在'

        const deviceLocal = Object.assign ( devices[ id ], device )

        if ( id !== device.id) removeDevice ( id )

        saveDevice ( deviceLocal )
        logger.info('DeviceService update success ')
        return 'ok'
    }

     delete = ( id: string ): string => {
        logger.info('DeviceService delete start ', id)

        if ( !checkExist ( id ) )
            return '该设备不存在'

        removeDevice ( id )
        logger.info('DeviceService delete success ')
        return 'ok'
    }

    getDeviceId = async ( id: string ): Promise<Map<string, any> > => {
        logger.info('DeviceService getDeviceId start ', id)

        const result = new Map<string, any>()

        if ( !checkExist ( id ) ){
            result.set('status', '该设备不存在')
            result.set('data', id)
            return result
        }

        try {
            const device = getDeviceById ( id )
            const resultId = await getDeviceId( device.ip )
            device.id = resultId
            changeDevice( id, device )
            result.set('status', 'ok')
            result.set('data', resultId)
            logger.info('DeviceService getDeviceId success ', id)
        }
        catch ( e ) {
            result.set('status', e.message)
            result.set('data', id)
            logger.error('DeviceService getDeviceId error ', id, e.message)
        }

        return result
    }

    upgrade = async ( id: string, file ): Promise<string> => {
        logger.info('DeviceService upgrade start ', id , file)

        if ( !checkExist ( id ) )
            return '该设备不存在'

        const device = getDeviceById ( id )
        if ( device === undefined ) {
            logger.error('DeviceService upgrade info ', '未识别到升级设备')
            return '未识别到升级设备'
        }

        try {
            const result = await upgrade( device.ip, file.buffer )
            if ( result ) {
                logger.info( 'DeviceService upgrade success ', result )
                return 'ok'
            } else {
                logger.error( 'DeviceService upgrade error ', result )
                return '升级失败'
            }
        } catch ( e ) {
            logger.error( 'DeviceService upgrade catch ', e.message )
            throw e
        }
    }

    rollback = async ( id: string ): Promise<string> => {
        logger.info('DeviceService rollback start ', id)

        if ( !checkExist ( id ) )
            return '该设备不存在'

        const device = getDeviceById ( id )
        if ( device === undefined ) {
            logger.error('DeviceService rollback info ', '未识别到升级设备')
            return '未识别到回退设备'
        }
        try {
            const result = await rollback ( device.ip, id )
            if ( result ){
                logger.info('DeviceService rollback success ', result)
                return 'ok'
            }
            else {
                logger.error('DeviceService rollback error ', result)
                return '回退失败'
            }
        } catch ( e ) {
            logger.error('DeviceService rollback error ', e.message)
            throw e
        }
    }
}