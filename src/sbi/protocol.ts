import { send } from './common/link/link'
import { send as httpSend } from './common/link/httpClient'
import { DataType, ENCODING, Parameter } from '../common/define'
import { getSyncId } from './common/package'
import { encode } from './common/encoder'
import { decode } from './common/decoder'
import { getLogger } from 'log4js'

const logger = getLogger('protocol')

export class ParameterResponse {
    constructor(public readonly command: number, public readonly result: string, public readonly value: string | number) {
    }
}

export async function getDeviceId(ip: string): Promise<string> {
    logger.info('start get device id', ip)

    const sendSyncId = getSyncId()
    const message = encode(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff]), sendSyncId)
    const response = await send(ip, message)
    const {syncId, deviceId} = decode(response)
    if (syncId !== sendSyncId) {
        logger.error(`syncId ${syncId} invalid, expect ${sendSyncId}`, response)
        return Promise.reject(Error('协议对接错误'))
    }

    logger.info('get device id', ip, deviceId.toString())
    return deviceId.toString()
}

export async function getOrdinaryParameter(ip: string, deviceId: string): Promise<Array<number>> {
    logger.info('start get ordinary parameter', ip, deviceId)
    const parameterIdList = new Array<number>()
    let current = 1
    do {
        const ret = await requestParameter(ip, deviceId, 3, current)

        parameterIdList.push(...ret.idList)

        if (ret.total === current) {
            logger.info('get ordinary parameter finished', ip, deviceId, parameterIdList)
            return parameterIdList
        }

        current++
    } while (true)
}

export async function getDebugParameter(ip: string, deviceId: string): Promise<Array<number>> {
    logger.info('start get debug parameter', ip, deviceId)
    const parameterIdList = new Array<number>()
    let current = 1
    do {
        const ret = await requestParameter(ip, deviceId, 4, current)

        parameterIdList.push(...ret.idList)

        if (ret.total === current) {
            logger.info('get debug parameter finished', ip, deviceId, parameterIdList)
            return parameterIdList
        }

        current++
    } while (true)
}

export async function setParameter(ip: string, deviceId: string, parameterList: Array<Parameter>): Promise<Array<ParameterResponse>> {
    const res = new Array<ParameterResponse>()

    logger.info('start set parameter', ip, deviceId, parameterList)

    const response = await request(ip, deviceId, createParameterSetBody(parameterList))
    if (response.readUInt8(0) !== 0x14) {
        logger.error(`command number [${response.readUInt8(0)}] mismatch, expect 0x14.`, response)
        return Promise.reject(Error('协议对接错误'))
    }

    let offset = 1
    for (const parameter of parameterList) {
        const typeLength = getTypeLength(parameter.type)
        if (response.readUInt8(offset) !== typeLength) {
            logger.error(`setParameter command length ${response.readUInt8(offset)} mismatch, expect ${typeLength}`, parameter, offset, response)
            return Promise.reject(Error('协议对接错误'))
        }

        const result = checkResponseCommand(response, offset + 1, parameter.command)
        if (result !== null) {
            res.push(new ParameterResponse(parameter.command, result, null))
        }

        offset += typeLength
    }

    logger.info('set parameter finished', ip, deviceId, res)

    return res
}

export async function getParameter(ip: string, deviceId: string, parameterList: Array<Parameter>): Promise<Array<ParameterResponse>> {
    const res = new Array<ParameterResponse>()

    logger.info('start get parameter', ip, deviceId, parameterList)

    const response = await request(ip, deviceId, createParameterGetBody(parameterList))
    if (response.readUInt8(0) !== 0x15) {
        logger.error(`command number [${response.readUInt8(0)}] mismatch, expect 0x15.`, response)
        return Promise.reject(Error('协议对接错误'))
    }

    let offset = 1
    for (const parameter of parameterList) {
        const typeLength = getTypeLength(parameter.type)
        if (response.readUInt8(offset) !== typeLength) {
            logger.error(`getParameter command length ${response.readUInt8(offset)} mismatch, expect ${typeLength}`, parameter, offset, response)
            return Promise.reject(Error('协议对接错误'))
        }

        res.push(getParameterResponse(response, offset + 1, parameter.command, parameter.type))
        offset += typeLength
    }

    logger.info('get parameter finished', ip, deviceId, res)
    return res
}

export async function rollback(ip: string, deviceId: string): Promise<boolean> {
    logger.info('start rollback')
    const body = await request(ip, deviceId, Buffer.from([5]))
    logger.info('rollback finish')
    return body.equals(Buffer.from([5]))
}

export async function upgrade(ip: string, version: Buffer): Promise<boolean> {
    logger.info('start upgrade')
    const ret = await httpSend(version, ip)
    logger.info('upgrade finish', ret)
    return ret
}

async function request(ip: string, sendDeviceId: string, sendBody: Buffer): Promise<Buffer> {
    const sendSyncId = getSyncId()
    const message = encode(sendDeviceId, sendSyncId, sendBody)

    const response = await send(ip, message)
    const {syncId, deviceId, body} = decode(response)
    if (syncId !== sendSyncId) {
        logger.error(`syncId ${syncId} invalid, expect ${sendSyncId}`, response)
        return Promise.reject(Error('协议对接错误'))
    }

    if (deviceId.toString() !== sendDeviceId) {
        logger.error(`device id ${deviceId.toString()} invalid, expect ${sendDeviceId}`, response)
        return Promise.reject(Error('协议对接错误'))
    }

    return body
}

async function requestParameter(ip: string, deviceId: string, command: number, expectedCurrent: number):
    Promise<{ total: number, idList: Array<number> }> {
    const idList = new Array<number>()

    const body = await request(ip, deviceId, Buffer.from([command]))
    if (body.length < 3 || body.length % 2 !== 1) {
        logger.error(`body length ${body.length} invalid`, body)
        return Promise.reject(Error('协议对接错误'))
    }

    if (command !== body.readUInt8(0)) {
        logger.error(`command number [${body.readUInt8(0)}] mismatch, expect ${command}.`, body)
        return Promise.reject(Error('协议对接错误'))
    }

    const current = body.readUInt8(2)
    if (current !== expectedCurrent) {
        logger.error(`current ${current} is not expected. expected ${expectedCurrent}`, body)
        return Promise.reject(Error('协议对接错误'))
    }

    const total = body.readUInt8(1)
    if (total < current) {
        logger.error(`total ${total} < current ${current}`, body)
        return Promise.reject(Error('协议对接错误'))
    }

    for (let i = 0; i < (body.length - 3) / 2; i++) {
        idList.push(body.readUInt16LE(3 + i * 2))
    }

    logger.debug(`current page id list [${idList}], total ${total}`)
    return {total, idList}
}

function checkResponseCommand(buffer: Buffer, offset: number, command: number): string {
    const responseCommand = buffer.readUInt16LE(offset)
    if (responseCommand === command) {
        return null
    }

    if ((command & 0xfff) !== command) {
        logger.error(`command ${command} is invalid`, buffer)
        throw Error('协议对接错误')
    }

    switch ((command & 0xfff) >> 12) {
        case 1:
            return '忙碌'
        case 2:
            return '应答失败'
        case 3:
            return '值设置超出范围'
        case 4:
            return '值设置低于范围'
        default:
            return '未知'
    }
}

function getParameterResponse(buffer: Buffer, offset: number, command: number, type: DataType | number): ParameterResponse {
    const result = checkResponseCommand(buffer, offset, command)
    if (result !== null) {
        return new ParameterResponse(command, result, null)
    }

    switch (type) {
        case DataType.bit:
            return new ParameterResponse(command, null, buffer.readUInt8(offset + 2) & 0x1)
        case DataType.uint8:
            return new ParameterResponse(command, null, buffer.readUInt8(offset + 2))
        case DataType.uint16:
            return new ParameterResponse(command, null, buffer.readUInt16LE(offset + 2))
        case DataType.uint32:
            return new ParameterResponse(command, null, buffer.readUInt32LE(offset + 2))
        case DataType.sint8:
            return new ParameterResponse(command, null, buffer.readInt8(offset + 2))
        case DataType.sint16:
            return new ParameterResponse(command, null, buffer.readInt16LE(offset + 2))
        case DataType.sint32:
            return new ParameterResponse(command, null, buffer.readInt32LE(offset + 2))
        default:
            if (typeof type !== 'number') {
                throw Error('数据类型错误')
            }

            const stringLength = buffer.slice(offset + 2, offset + 2 + type).indexOf('\0')
            if (stringLength === -1) {
                // remove '\0'
                return new ParameterResponse(command, null, buffer.toString(ENCODING, offset + 2, offset + 2 + type))
            } else {
                return new ParameterResponse(command, null, buffer.toString(ENCODING, offset + 2, offset + 2 + stringLength))
            }
    }
}

// type self length + totally length (1B) + command length (2B)
function getTypeLength(type: DataType | number): number {
    if (typeof type === 'number') {
        return type + 3   // type + 1 + 2
    }

    switch (type) {
        case DataType.bit:
        case DataType.uint8:
        case DataType.sint8:
            return 4    // 1 + 1 + 2
        case DataType.uint16:
        case DataType.sint16:
            return 5    // 2 + 1 + 2
        case DataType.uint32:
        case DataType.sint32:
            return 7    // 4 + 1 + 2
    }
}

function getParameterBody(parameterList): Buffer {
    let count = 1
    for (const parameter of parameterList) {
        count += getTypeLength(parameter.type)
    }

    return Buffer.alloc(count)
}

function createParameterGetBody(parameterList: Array<Parameter>): Buffer {
    const body = getParameterBody(parameterList)

    body.writeUInt8(0x15, 0)

    let count = 1
    for (const parameter of parameterList) {
        body.writeUInt8(getTypeLength(parameter.type), count)
        count += 1
        body.writeUInt16LE(parameter.command, count)
        count += 2

        switch (parameter.type) {
            case DataType.bit:
            case DataType.uint8:
            case DataType.sint8:
                count += 1
                break

            case DataType.uint16:
            case DataType.sint16:
                count += 2
                break

            case DataType.uint32:
            case DataType.sint32:
                count += 4
                break

            default:
                count += parameter.type
        }
    }

    return body
}

function createParameterSetBody(parameterList: Array<Parameter>): Buffer {
    const body = getParameterBody(parameterList)

    body.writeUInt8(0x14, 0)

    let count = 1
    for (const parameter of parameterList) {
        body.writeUInt8(getTypeLength(parameter.type), count)
        count += 1
        body.writeUInt16LE(parameter.command, count)
        count += 2

        if (typeof parameter.value === 'string' && typeof parameter.type === 'number') {
            body.write(parameter.value, count, parameter.type, ENCODING)
            count += parameter.type
        } else if (typeof parameter.value === 'number' && typeof parameter.type !== 'number') {
            switch (parameter.type) {
                case DataType.bit:
                case DataType.uint8:
                    body.writeUInt8(parameter.value, count)
                    count += 1
                    break

                case DataType.sint8:
                    body.writeInt8(parameter.value, count)
                    count += 1
                    break

                case DataType.uint16:
                    body.writeUInt16LE(parameter.value, count)
                    count += 2
                    break

                case DataType.sint16:
                    body.writeInt16LE(parameter.value, count)
                    count += 2
                    break

                case DataType.uint32:
                    body.writeUInt32LE(parameter.value, count)
                    count += 4
                    break

                case DataType.sint32:
                    body.writeInt32LE(parameter.value, count)
                    count += 4
                    break

                default:
                    throw Error('服务器内部错误')
            }
        } else {
            logger.error('parameter invalid', parameter)
            throw Error(`服务器内部错误`)
        }
    }

    return body
}
