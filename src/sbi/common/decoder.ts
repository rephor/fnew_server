import { isBufferEmpty } from '../../common/util'
import { backEscape, crc16 } from './package'
import { getLogger } from 'log4js'

const logger = getLogger('decoder')

export function decode(message: Buffer): { body: Buffer, deviceId: Buffer, syncId: number } {
    if (isBufferEmpty(message)) {
        logger.error('buffer is null')
        throw Error('协议对接错误')
    }

    if (message.length < 12) {
        logger.error(`buffer length ${message.length} invalid`, message)
        throw Error('协议对接错误')
    }

    if (message[0] !== 0x7e || message[message.length - 1] !== 0x7e) {
        logger.error('buffer head or tail invalid', message)
        throw Error('协议对接错误')
    }

    const backEscaped = backEscape(message.slice(1, message.length - 1))
    if (backEscaped === null) {
        logger.error('back escape failed', message)
        throw Error('协议对接错误')
    }

    const crc = crc16(backEscaped, backEscaped.length - 2)
    if (crc !== backEscaped.readUInt16LE(backEscaped.length - 2)) {
        logger.error(`crc mismatch ${crc} != ${backEscaped.readUInt16LE(backEscaped.length - 2)}`, message)
        throw Error('协议对接错误')
    }

    if (backEscaped[0] !== 0x05) {
        logger.error(`protocol layer ${backEscaped[0]} invalid`, message)
        throw Error('协议对接错误')
    }

    const syncId = backEscaped.readUInt16LE(6)
    if ((syncId & 0xf000) >> 12 !== 8) {
        logger.error(`syncId ${syncId} invalid`, message)
        throw Error('协议对接错误')
    }

    // body is empty
    if (backEscaped.length === 10) {
        return {body: Buffer.alloc(0), deviceId: backEscaped.slice(1, 6), syncId: syncId & 0xfff}
    } else {
        return {body: backEscaped.slice(8, backEscaped.length - 2), deviceId: backEscaped.slice(1, 6), syncId: syncId & 0xfff}
    }
}