import { isBufferEmpty } from "../src/common/util"
import { backEscape, crc16, escape } from "../src/sbi/common/package"

export function encode(deviceId, syncId, body) {
    if (deviceId === undefined || deviceId === null) {
        logger.error('device id is null')
        return null
    }

    if (deviceId.length !== 5) {
        logger.error(`device id ${deviceId} length invalid`)
        return null
    }

    let bodyLength
    if (isBufferEmpty(body)) {
        bodyLength = 0
    } else {
        bodyLength = body.length
    }

    const beforeEscape = Buffer.alloc(10 + bodyLength)
    beforeEscape.fill(0x05, 0, 1)
    beforeEscape.fill(deviceId, 1, 6)
    beforeEscape.writeUInt16LE(syncId | 0x8000, 6)

    if (bodyLength > 0) {
        beforeEscape.fill(body, 8, 8 + bodyLength)
    }

    const crc = crc16(beforeEscape, beforeEscape.length - 2)
    beforeEscape.writeUInt16LE(crc, beforeEscape.length - 2)

    const escaped = escape(beforeEscape)

    return Buffer.concat([Buffer.from('~'), escaped, Buffer.from('~')])
}

export function decode(message) {
    if (isBufferEmpty(message)) {
        throw Error('buffer is null')
    }

    if (message.length < 12) {
        throw Error('buffer length invalid')
    }

    if (message[0] !== 0x7e || message[message.length - 1] !== 0x7e) {
        throw Error('buffer head or tail invalid')
    }

    const backEscaped = backEscape(message.slice(1, message.length - 1))
    if (backEscaped === null) {
        throw Error('back escape failed')
    }

    const crc = crc16(backEscaped, backEscaped.length - 2)
    if (crc !== backEscaped.readUInt16LE(backEscaped.length - 2)) {
        throw Error('crc mismatch')
    }

    if (backEscaped[0] !== 0x05) {
        throw Error('protocol layer invalid')
    }

    const syncId = backEscaped.readUInt16LE(6)
    if ((syncId & 0xf000) >> 12 !== 0) {
        throw Error('syncId invalid')
    }

    // body is empty
    if (backEscaped.length === 10) {
        return {body: Buffer.alloc(0), deviceId: backEscaped.slice(1, 6), syncId: syncId & 0xfff}
    } else {
        return {body: backEscaped.slice(8, backEscaped.length - 2), deviceId: backEscaped.slice(1, 6), syncId: syncId & 0xfff}
    }
}