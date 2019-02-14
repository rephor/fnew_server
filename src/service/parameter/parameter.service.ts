import { Injectable } from '@nestjs/common'
import {
    checkExist,
    getDeviceById,
    getParams,
    getTableId,
    setDeviceCommond, updateLocalParameters, updateParameters,
} from '../common/memory.db'
import { getLogger } from 'log4js'
import { getDebugParameter, getOrdinaryParameter, getParameter, ParameterResponse, setParameter } from '../../sbi/protocol'
import { Parameter } from '../../common/define'
import { ParamModel } from '../model/model'

const logger = getLogger( 'device' )

@Injectable()
export class ParameterService {

    getOrdinary = async ( id: string ): Promise<Array<number>> => {
        logger.info('ParameterService getOrdinary start id ', id)

        if ( !checkExist( id ) ){
            logger.info('ParameterService getOrdinary id not exist ', id)
            return []
        }

        const device = getDeviceById( id )
        try {
            logger.info( 'ordinary device ', id, device.ip )
            const result = await getOrdinaryParameter( device.ip, id )
            logger.info( 'ordinary ps', result )
            setDeviceCommond( id, result )
            logger.info('ParameterService getOrdinary success result ', result)
            return result
        } catch ( e ) {
            logger.error('ParameterService getOrdinary catch e ', e)
            throw e
        }
    }

    getDebug = async ( id: string ): Promise<Array<number>> => {
        logger.info('ParameterService getDebug start id ', id)

        if ( !checkExist( id ) ){
            logger.info('ParameterService getDebug id not exist ', id)
            return []
        }

        const device = getDeviceById( id )
        try {
            const result = await getDebugParameter( device.ip, id )
            setDeviceCommond( id, result )
            logger.info('ParameterService getDebug success result ', result)
            return result
        } catch ( e ) {
            logger.error('ParameterService getOrdinary catch e  ', e)
            throw e
        }
    }
    getAllParams = ( id: string ) => {
        logger.info('ParameterService getAllParams start id ', id)

        const all = getParams( id ) ? getParams( id ) : {}
        const data = {}
        for ( const i in all ) {
            if ( !all.hasOwnProperty( i ) ) {
                continue
            }
            const array = all[ i ]
            const arrayNotEmp = []
            for ( const j in array ) {
                if ( !array.hasOwnProperty( j ) ) {
                    continue
                }
                const d: ParamModel =
                    new ParamModel(array[ j ].command, array[ j ].type, array[ j ].value !== null ? array[ j ].value + '' : array[ j ].value,
                        array[ j ].localValue !== null ? array[ j ].localValue + '' : array[ j ].localValue, array[ j ].name)
                arrayNotEmp.push( d )
            }
            data[ i ] = arrayNotEmp
        }

        logger.info('ParameterService getAllParams success data ', data)
        return data
    }

    remote = async ( id: string, keys: Array<number> ) => {
        logger.info('ParameterService remote start id ', id)

        if ( !checkExist( id ) ){
            logger.info('ParameterService remote id not exist  ', id)
            return '该设备不存在'
        }

        const device = getDeviceById( id )
        const all = getParams( id )
        try {
            const paramArray: Array<Parameter> = []
            keys.forEach( value => {
                const tableId = getTableId( value )
                if ( all[ tableId ] && all[ tableId ][ value ] )
                    paramArray.push( all[ tableId ][ value ] )
            } )
            const result: Array<ParameterResponse> = await getParameter( device.ip, id, paramArray )
            logger.info(result)
            updateParameters( id, result )
            logger.info('ParameterService remote success result ', result)
            return 'ok'
        } catch ( e ) {
            logger.error('ParameterService remote catch e  ', e)
            throw e
        }
    }

    local = async ( id: string, o: object ) => {
        logger.info('ParameterService local start id = ' , id , ' kv = ', o )

        if ( !checkExist( id ) ){
            logger.info('ParameterService local id not exist  ' , id )
            return '该设备不存在'
        }

        try {
            for ( const i in o ){
                if ( !o.hasOwnProperty ( i ) ) {
                    continue
                }
                if (!updateLocalParameters( id, +i, o[i])){
                    logger.error('ParameterService local type error ' )
                    return '请校验值类型是否符合规范'
                }
            }
            logger.info('ParameterService local success ' )
            return 'ok'
        } catch ( e ) {
            logger.error('ParameterService local catch e ', e)
            throw e
        }
    }

    setRemote = async ( id: string, keys: Array<number> ) => {
        logger.info('ParameterService local start id = ' , id , ' keys = ', keys )

        if ( !checkExist( id ) ){
            logger.info('ParameterService setRemote id not exist  ' , id )
            return '该设备不存在'
        }

        const device = getDeviceById( id )
        const all = getParams( id )
        try {
            const paramArray: Array<Parameter> = []
            keys.forEach( value => {
                const tableId = getTableId( value )
                if ( all[ tableId ] && all[ tableId ][ value ] ) {
                    const p: ParamModel = all[ tableId ][ value ]
                    if (p.localValue === null) return
                    if ( typeof p.type === 'number' ) {
                        paramArray.push(new Parameter(p.command, p.type, p.localValue + ''))
                    }
                    else
                        paramArray.push(new Parameter(p.command, p.type, +p.localValue ))
                }
            } )
            await setParameter( device.ip, id, paramArray )
            logger.info('ParameterService setRemote success ' )
            return 'ok'
        } catch ( e ) {
            logger.info('ParameterService setRemote catch e ', e)
            throw e
        }
    }
}