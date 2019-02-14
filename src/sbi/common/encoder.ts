import { isBufferEmpty } from '../../common/util'
import { crc16, escape } from './package'
import { getLogger } from 'log4js'

const logger = getLogger('encoder')

export function encode(deviceId: string | Buffer, syncId: number, body?: Buffer): Buffer {
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
    beforeEscape.writeUInt16LE(syncId, 6)

    if (bodyLength > 0) {
        beforeEscape.fill(body, 8, 8 + bodyLength)
    }

    const crc = crc16(beforeEscape, beforeEscape.length - 2)
    beforeEscape.writeUInt16LE(crc, beforeEscape.length - 2)

    const escaped = escape(beforeEscape)

    return Buffer.concat([Buffer.from('~'), escaped, Buffer.from('~')])
}
