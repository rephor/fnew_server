import { DataType, ENCODING, Parameter } from "../src/common/define"
import { readCsv } from "../src/service/common/csv.util"
import { getLogger } from "log4js"
import { decode, encode } from "./code.mock"
import { checkParameter } from "../src/common/util"

const logger = getLogger('protocol.mock')
const data = require('./data.mock.json')
const ordinaryParameterInfo = {count: 1, handle: null, data: []}
const debugParameterInfo = {count: 1, handle: null, data: []}
const commandList = readCsv('./config/parameter.csv')

export function init() {

    logger.info(`ordinaryParameter 0 - ${0x5ff}, debugParameter ${0xc00} - ${0xdff}`)

    for (const command of data.parameter.data) {
        const type = getDataType(command[0])
        if (type === null) {
            logger.error(`not found command ${command[0]} from csv`)
            continue
        }

        const parameter = new Parameter(command[0], type, command[1])
        if (!checkParameter(parameter)) {
            logger.error(`parameter check failed`, parameter)
            continue
        }

        if (isOrdinaryParameter(command[0])) {
            ordinaryParameterInfo.data.push(parameter)
        } else if (debugParameter(command[0])) {
            debugParameterInfo.data.push(parameter)
        } else {
            logger.error('unknown parameter', command)
        }
    }

    logger.info(ordinaryParameterInfo, debugParameterInfo)
}

function getDataType(id) {
    for (const command of commandList) {
        if (command.length !== 3) {
            logger.error(`invalid command ${command}`)
            continue
        }

        if (+command[0] !== id) {
            continue
        }

        switch (command[2]) {
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
                return +command[2]
        }
    }

    return null
}

function isOrdinaryParameter(id) {
    return id >= 0 && id <= 0x5ff
}

function debugParameter(id) {
    return id >= 0xc00 && id <= 0xdff
}

// type self length + totally length (1B) + command length (2B)
function getTypeLength(type) {
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

function getParameterById(command) {
    for (const parameter of ordinaryParameterInfo.data) {
        if (parameter.command !== command) {
            continue
        }

        return parameter
    }

    for (const parameter of debugParameterInfo.data) {
        if (parameter.command !== command) {
            continue
        }

        return parameter
    }

    return null
}

function setLocalParameter(body) {
    let offset = 1

    while (offset < body.length) {
        const typeLength = body.readUInt8(offset)
        offset += 1
        const command = body.readUInt16LE(offset)
        offset += 2

        const parameter = getParameterById(command)
        if (parameter === null) {
            logger.error(`not found command ${command}`)
            return null
        }

        if (typeLength !== getTypeLength(parameter.type)) {
            logger.error(`receive unexpected typeLength ${typeLength} !== ${getTypeLength(parameter.type)}`)
            return null
        }

        logger.info('find parameter', parameter)

        switch (parameter.type) {
            case DataType.bit:
            case DataType.uint8:
                parameter.value = body.readUInt8(offset)
                offset += 1
                break

            case DataType.sint8:
                parameter.value = body.readInt8(offset)
                offset += 1
                break

            case DataType.uint16:
                parameter.value = body.readUInt16LE(offset)
                offset += 2
                break

            case DataType.sint16:
                parameter.value = body.readInt16LE(offset)
                offset += 2
                break

            case DataType.uint32:
                parameter.value = body.readUInt32LE(offset)
                offset += 4
                break

            case DataType.sint32:
                parameter.value = body.readInt32LE(offset)
                offset += 4
                break

            default:
                const stringLength = body.slice(offset, offset + parameter.type).indexOf('\0')
                logger.info('stringLength', stringLength)
                if (stringLength === -1) {
                    // remove '\0'
                    parameter.value = body.toString(ENCODING, offset, offset + parameter.type)
                } else {
                    parameter.value = body.toString(ENCODING, offset, offset + stringLength)
                }

                offset += parameter.type
        }

        logger.info('after set parameter', parameter)
    }

    return body
}

function setParameterBody(body) {
    let offset = 1

    while (offset < body.length) {
        const typeLength = body.readUInt8(offset)
        offset += 1
        const command = body.readUInt16LE(offset)
        offset += 2

        const parameter = getParameterById(command)
        if (parameter === null) {
            logger.error(`not found command ${command}`)
            return null
        }

        if (typeLength !== getTypeLength(parameter.type)) {
            logger.error(`receive unexpected typeLength ${typeLength} !== ${getTypeLength(parameter.type)}`)
            return null
        }

        logger.info('find parameter', parameter)

        switch (parameter.type) {
            case DataType.bit:
            case DataType.uint8:
                body.writeUInt8(parameter.value, offset)
                offset += 1
                break

            case DataType.sint8:
                body.writeInt8(parameter.value, offset)
                offset += 1
                break

            case DataType.uint16:
                body.writeUInt16LE(parameter.value, offset)
                offset += 2
                break

            case DataType.sint16:
                body.writeInt16LE(parameter.value, offset)
                offset += 2
                break

            case DataType.uint32:
                body.writeUInt32LE(parameter.value, offset)
                offset += 4
                break

            case DataType.sint32:
                body.writeInt32LE(parameter.value, offset)
                offset += 4
                break

            default:
                body.write(parameter.value, offset, parameter.type, ENCODING)
                offset += parameter.type
        }
    }

    return body
}

function createParameterIdListBody(info, command) {
    if (info.count < 1) {
        return null
    }

    const totalPage = Math.ceil(info.data.length / data.parameter.page)
    if (totalPage < info.count) {
        return null
    }

    const offset = (info.count - 1) * data.parameter.page
    logger.info(`offset = ${offset}`)
    let currentCount
    // the last page
    if (totalPage === info.count) {
        currentCount = info.data.length - offset
    } else {
        currentCount = 2
    }

    logger.info(`currentCount = ${currentCount}`)
    const body = Buffer.alloc(3 + currentCount * 2)

    body.writeUInt8(command, 0)
    body.writeUInt8(totalPage, 1)
    body.writeUInt8(info.count, 2)

    for (let i = 0; i < currentCount; i++) {
        body.writeUInt16LE(info.data[i + offset].command, 3 + i * 2)
    }

    info.count++
    return body
}

function parameterTimeout(info) {
    if (info.handle !== null) {
        clearTimeout(info.handle)
    }

    info.handle = setTimeout(function () {
        info.count = 1
        info.handle = null
        logger.error('time out')
    }, 5000)
}

export function onReceive(message) {
    try {
        const {body, deviceId, syncId} = decode(message)
        if (body.length === 0) {
            if (deviceId.compare(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff])) !== 0) {
                logger.error('receive unexpected device id', deviceId)
                return null
            }

            return encode(data.deviceId, syncId, Buffer.alloc(0))
        }

        if (data.deviceId !== deviceId.toString()) {
            logger.error(`receive unexpected device id ${deviceId} ${deviceId.length}, expect ${data.deviceId} ${data.deviceId.length}`)
            return null
        }

        if (body[0] === 0x01) {
            logger.info('receive login response')
            return null
        }

        if (body[0] === 0x02) {
            logger.debug('receive heart beat response', syncId)
            return null
        }

        logger.info(`receive request ${body[0]}`)

        if (body[0] === 0x03) {
            parameterTimeout(ordinaryParameterInfo)
            return encode(data.deviceId, syncId, createParameterIdListBody(ordinaryParameterInfo, 0x03))
        }

        if (body[0] === 0x04) {
            parameterTimeout(debugParameterInfo)
            return encode(data.deviceId, syncId, createParameterIdListBody(debugParameterInfo, 0x04))
        }

        if (body[0] === 0x05) {
            return encode(data.deviceId, syncId, Buffer.from([5]))
        }

        if (body[0] === 0x14) {
            if (setLocalParameter(body) === null) {
                return null
            }

            return encode(data.deviceId, syncId, body)
        }

        if (body[0] === 0x15) {
            if (setParameterBody(body) === null) {
                return null
            }

            return encode(data.deviceId, syncId, body)
        }
    } catch (e) {
        logger.error(e)
        return null
    }

    logger.error('unexpect message')
    return null
}

