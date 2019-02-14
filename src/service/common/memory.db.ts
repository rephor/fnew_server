import { getLogger } from 'log4js'
import { readCsv, writeCsv } from './csv.util'
import { join } from 'path'
import { Device, ParamModel } from '../model/model'
import { onConfigChange } from '../../sbi/common/link/link'
import { Command, Config, DataType, LinkType, Parameter } from '../../common/define'
import { ParameterResponse } from '../../sbi/protocol'
import { getConfig } from '../../common/config'
import { checkParameter } from '../../common/util'
import { isIPv4 } from 'net'

const logger = getLogger( 'memory.service' )
const config = getConfig( 'static' )

const device_csv_name: string = 'device.csv'
const config_csv_name: string = 'config.csv'
const param_csv_name: string = 'parameter.csv'

export const deviceMap = {}
let configMap = {} as Config
const parameterArray = []

let tree = {}
const parameters = {}

const path = config.csvpath

function initDeviceMap() {
    const list = readCsv( join( path, device_csv_name ) )
    if ( list === null ) {
        logger.error( '读取文件失败[initDeviceMap]' )
        return
    }

    list.forEach( ( value, index ) => {
        if ( 0 === index ) return
        if ( 6 !== value.length ) {
            logger.error( value, '该条数据缺少必要参数[initDeviceMap]' )
            return
        }
        if ( !isIPv4(value[ 4 ])) {
            logger.error( value, '该条数据IP格式有误' )
            return
        }

        try {
            const children: Array<Device> = []
            const device: Device = new Device( value[ 3 ], value[ 2 ], value[ 0 ], value[ 4 ], value[ 5 ], value[ 1 ], children )
            deviceMap[ device.id ] = device
        } catch ( e ) {
            logger.error( value, '该条数据不符合规范[initDeviceMap]' )
        }
    } )
}

function initConfigMap() {
    const list = readCsv( join( path, config_csv_name ) )
    if ( list === null ) {
        logger.error( '读取文件失败[initConfigMap]' )
        return
    }

    list.forEach( ( value, index ) => {
        if ( 0 === index ) return
        if ( 2 !== value.length ) {
            logger.error( value, '该条数据缺少必要参数[initConfigMap]' )
            return
        }

        try {
            switch ( value[ 0 ] ) {
                case 'connectionMode':
                    switch ( value [ 1 ] ) {
                        case 'com':
                            configMap.connectionMode = LinkType.com
                            break
                        case 'udp':
                            configMap.connectionMode = LinkType.udp
                            break
                        case 'tcp':
                            configMap.connectionMode = LinkType.tcp
                            break
                        default:
                            logger.error( 'config connectionMode setValue error', value[ 1 ] )
                            break
                    }
                    break
                case 'tcpPort':
                    configMap.tcpPort = +value[ 1 ]
                    break
                case 'udpPort':
                    configMap.udpPort = +value[ 1 ]
                    break
                case 'httpPort':
                    configMap.httpPort = +value[ 1 ]
                    break
                case 'comPath':
                    configMap.comPath = value[ 1 ]
                    break
                case 'comBaudRate':
                    switch ( +value[ 1 ] ) {
                        case 115200:
                            configMap.comBaudRate = 115200
                            break
                        case 57600:
                            configMap.comBaudRate = 57600
                            break
                        case 38400:
                            configMap.comBaudRate = 38400
                            break
                        case 19200:
                            configMap.comBaudRate = 19200
                            break
                        case 9600:
                            configMap.comBaudRate = 9600
                            break
                        case 4800:
                            configMap.comBaudRate = 4800
                            break
                        case 2400:
                            configMap.comBaudRate = 2400
                            break
                        default:
                            logger.error( 'config comBaudRate setValue error', value[ 1 ] )
                            break
                    }
                    break
                case 'comDataBits':
                    switch ( +value[ 1 ] ) {
                        case 8:
                            configMap.comDataBits = 8
                            break
                        case 7:
                            configMap.comDataBits = 7
                            break
                        case 6:
                            configMap.comDataBits = 6
                            break
                        case 5:
                            configMap.comDataBits = 5
                            break
                        default:
                            logger.error( 'config comDataBits setValue error', value[ 1 ] )
                            break
                    }
                    break
                case 'comParity':
                    switch ( value[ 1 ] ) {
                        case 'none':
                            configMap.comParity = 'none'
                            break
                        case 'even':
                            configMap.comParity = 'even'
                            break
                        case 'mark':
                            configMap.comParity = 'mark'
                            break
                        case 'odd':
                            configMap.comParity = 'odd'
                            break
                        case 'space':
                            configMap.comParity = 'space'
                            break
                        default:
                            logger.error( 'config comParity setValue error', value[ 1 ] )
                            break
                    }
                    break
                case 'comStopBits':
                    switch ( +value[ 1 ] ) {
                        case 1:
                            configMap.comStopBits = 1
                            break
                        case 2:
                            configMap.comStopBits = 2
                            break
                        default:
                            logger.error( 'config comStopBits setValue error', value[ 1 ] )
                            break
                    }
                    break
            }
        } catch ( e ) {
            logger.error( value, '该条数据不符合规范[initConfigMap]' )
        }
    } )
}

function initParameterArray() {
    const list = readCsv( join( path, param_csv_name ) )
    if ( list === null ) {
        logger.error( '读取文件失败[initParameterArray]' )
        return
    }

    list.forEach( ( value, index ) => {
        if ( 0 === index ) return
        if ( 3 !== value.length ) {
            logger.error( value, '该条数据缺少必要参数[initDeviceMap]' )
            return
        }
        try {
            parameterArray[ +value[ 0 ] ] = {
                type: getDataType( value[ 2 ] ),
                description: value[ 1 ],
            }
        } catch ( e ) {
            logger.error( value, '该条数据不符合规范[initDeviceMap]' )
        }
    } )
}

function getDataType( key: string ): DataType | number {
    switch ( key ) {
        case DataType.bit:
            return DataType.bit
        case DataType.uint8:
            return DataType.uint8
        case DataType.uint16:
            return DataType.uint16
        case DataType.uint32:
            return DataType.uint32
        case DataType.sint8:
            return DataType.sint8
        case DataType.sint16:
            return DataType.sint16
        case DataType.sint32:
            return DataType.sint32
        default:
            return +key
    }
}

export function initTree( exportable?: boolean) {
    if ( deviceMap === {} ) {
        logger.info( '内存中数据为空,无法得到相关逻辑[initTree]' )
        return
    }

    tree = {}
    for ( const i in deviceMap ) {
        if ( !deviceMap.hasOwnProperty( i ) ) {
            continue
        }
        deviceMap[ i ].children = []
    }

    for ( const i in deviceMap ) {
        if ( !deviceMap.hasOwnProperty( i ) ) {
            continue
        }

        if ( !deviceMap[ deviceMap[ i ].parentId ] ) {
            const devices: Array<Device> = tree[ deviceMap[ i ].parentId ] ? tree[ deviceMap[ i ].parentId ] : []
            devices.push( deviceMap[ i ] )
            tree[ deviceMap[ i ].parentId ] = devices
        } else {
            const d: Device = deviceMap[ deviceMap[ i ].parentId ]
            const children: Array<Device> = d.children ? d.children : []
            children.push( deviceMap[ i ] )
            d.children = children
            const devices: Array<Device> = tree[ d.parentId ] ? tree[ d.parentId ] : []
            const devicesNes: Array<Device> = []
            devices.forEach( ( v ) => {
                if ( v.id === d.id ) devicesNes.push( d )
                else devicesNes.push( v )
            } )
            tree[ d.parentId ] = devicesNes
        }
    }

    if (exportable) exportDevice()

}

export function exportDevice() {
    logger.info( 'exportDevice start' )
    if ( deviceMap === {} ) {
        logger.info( '内存中数据为空,无法导出csv[exportDevice]' )
        return
    }

    const data = [ [ '所属分类', '设备型号', '设备名称', '设备ID', '设备IP', '子命令列表' ] ]

    for ( const i in deviceMap ) {
        if ( !deviceMap.hasOwnProperty( i ) ) {
            continue
        }

        const row = []
        row.push( deviceMap[ i ].parentId.slice( 0, 10 ) )
        row.push( deviceMap[ i ].type )
        row.push( deviceMap[ i ].name )
        row.push( deviceMap[ i ].id.slice( 0, 10 ) )
        row.push( deviceMap[ i ].ip )
        row.push( deviceMap[ i ].subcommand )
        data.push( row )
    }

    // deviceMap.forEach((value) => {
    //     const row = []
    //     row.push(value.parentId.slice(0, 10))
    //     row.push(value.type)
    //     row.push(value.name)
    //     row.push(value.id.slice(0, 10))
    //     row.push(value.ip)
    //     row.push(value.port)
    //     row.push(value.subcommand)
    //     data.push(row)
    // })
    writeCsv( join( path, device_csv_name ), data )
}

export function exportConfig() {
    const data = [ [ '配置名称', '配置值' ] ]
    for ( const i in configMap ) {
        if ( !configMap.hasOwnProperty( i ) ) {
            continue
        }

        const row = []
        row.push( i )
        row.push( configMap[ i ] )
        data.push( row )
    }

    // configMap.forEach((value, key) => {
    //     const row = []
    //     row.push(key)
    //     row.push(value)
    //     data.push(row)
    // })
    writeCsv( join( path, config_csv_name ), data )
}

export function getTree() {
    return tree
}

export function getSetting() {
    return configMap
}

export function setConfig( c: Config ) {
    onConfigChange( c )
    configMap = c
    exportConfig()
}

export function getParams( id: string ) {
    return parameters[ id ]
}

export function getDevices() {
    return deviceMap
}

export function getDeviceById( id: string ): Device {
    return deviceMap[ id ]
}

export function saveDevice( device: Device ) {
    deviceMap[ device.id ] = device
    initTree(true)
}

export function removeDevice( id: string ) {
    const d = getDeviceById(id)
    d.children.forEach((value => {
        delete deviceMap[ value.id ]
    }))
    delete deviceMap[ id ]
    initTree(true)
}

export function changeDevice( idOld: string, device: Device ) {
    delete deviceMap[ idOld ]
    deviceMap[ device.id ] = device
    for ( const i in deviceMap ) {
        if ( !deviceMap.hasOwnProperty( i ) ) {
            continue
        }
        if ( deviceMap[ i ].parentId === idOld ) {
            deviceMap[ i ].parentId = device.id
        }
    }

    initTree(true)
}

export function setDeviceCommond( id: string, commondArray: Array<number> ) {
    let commondStr = deviceMap[ id ].subcommand ? deviceMap[ id ].subcommand : ''
    const commods = parameters[ id ] ? parameters[ id ] : {}

    commondArray.forEach( value => {
        const s: Array<string> = commondStr.split( ',' )
        if ( s.indexOf( value.toString() ) < 0 ) {
            if ( commondStr === '' ) commondStr += value
            else commondStr += ', ' + value
        }
        const tableId = getTableId( value )
        const table = commods[ tableId ] ? commods[ tableId ] : []
        const commod: Command = parameterArray[ value ]
        if ( !commod || table[ value ] ) return
        table[ value ] = new ParamModel( value, commod.type, null, null, commod.description )
        commods[ tableId ] = table
    } )

    deviceMap[ id ].subcommand = commondStr
    parameters[ id ] = commods
}

export function updateLocalParameters( id: string, key: number, value: string | number ): boolean{
    const commods = parameters[ id ] ? parameters[ id ] : {}
    const tableId = getTableId( key )
    const commandModel: ParamModel = commods[ tableId ][ key ]

    if ( typeof commandModel.type === 'number' ){
        commandModel.localValue = value + ''
    }
    else{
        if ( !isNumber(value) && value !== '0') return false
        commandModel.localValue = +value
    }

    if (!checkParameter(new Parameter(commandModel.command, commandModel.type, commandModel.localValue))) return false

    commods[ tableId ][ key ] = commandModel
    parameters[ id ] = commods
    return true
}

export function updateParameters( id: string, commandArray: Array<ParameterResponse> ) {
    const commands = parameters[ id ] ? parameters[ id ] : {}

    commandArray.forEach( value => {
        const tableId = getTableId( value.command )
        const commandModel: ParamModel = commands[ tableId ][ value.command ]
        commandModel.value = value.value
        commands[ tableId ][ value.command ] = commandModel
    } )

    parameters[ id ] = commands
}

export function getTableId( key: number ): string {
    if ( key > 0 && key <= 255 ) {
        return '3'
    } else if ( key > 255 && key <= 511 ) {
        return '4'
    } else if ( key > 511 && key <= 767 ) {
        return '2'
    } else if ( key > 767 && key <= 1023 ) {
        return '1'
    } else if ( key > 1023 && key <= 1279 ) {
        return '5'
    } else if ( key > 1279 && key <= 1535 ) {
        return '6'
    } else if ( key >= 3072 && key <= 3327 ) {
        return '5'
    } else if ( key > 3327 && key <= 3583 ) {
        return '6'
    } else return '0'
}

export function isNumber(val) {
    const regPos = /^\+?[1-9][0-9]*$/
    return regPos.test( val )
}

export function checkExist( id: string ): boolean {
    const devices = getDevices()
    return !!devices[ id ]
}

export function init() {
    initDeviceMap()
    initConfigMap()
    initParameterArray()

    initTree()

    onConfigChange( configMap )

    logger.info( parameters )
    // logger.info( deviceMap )
}