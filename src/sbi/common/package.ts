import { getLogger } from 'log4js'
import { isBufferEmpty } from '../../common/util'

const logger = getLogger('package')

let syncId = 0

export function getSyncId(): number {
    syncId = (syncId + 1) % 0xfff

    return syncId
}

export function crc16(buffer: Buffer, length?: number): number {
    let crc = 0

    if (isBufferEmpty(buffer)) {
        logger.error('buffer is null', buffer)
        throw Error('buffer is empty')
    }

    if (length === undefined) {
        length = buffer.length
    } else if (length > buffer.length){
        logger.error(`length ${length} > buffer length ${buffer.length}`)
        throw Error('length > buffer length')
    }

    for (let i = 0; i < length; i++) {
        crc = ((crc >> 8) | (crc << 8)) & 0xffff
        crc ^= buffer[i]
        crc ^= ((crc & 0xff) >> 4) & 0xffff
        crc ^= ((crc << 8) << 4) & 0xffff
        crc ^= (((crc & 0xff) << 4) << 1) & 0xffff
    }

    return crc
}

export function escape(origin: Buffer): Buffer {
    if (isBufferEmpty(origin)) {
        return Buffer.alloc(0)
    }

    let ret = 0
    const des = Buffer.alloc(origin.length * 2)

    for (const value of origin) {
        if (value === 0x7E) {
            des[ret++] = 0x5E
            des[ret++] = 0x7D
        } else if (value === 0x5E) {
            des[ret++] = 0x5E
            des[ret++] = 0x5D
        } else {
            des[ret++] = value
        }
    }

    return des.slice(0, ret)
}

export function backEscape(origin: Buffer): Buffer {
    if (isBufferEmpty(origin) || origin.length < 8) {
        logger.error(`unexpect buffer`, origin)
        return null
    }

    const des = Buffer.alloc(origin.length)

    let desLength = 0

    for (let i = 0; i < origin.length;) {
        if (origin[i] === 0x7E) {
            logger.error(`unexpect buffer at [${i}]`, origin)
            return null
        }

        if (origin[i] === 0x5E) {
            if (i === origin.length - 1) {
                logger.error(`unexpect buffer at [${i}]`, origin)
                return null
            }

            if (origin[i + 1] === 0x7D) {
                des[desLength++] = 0x7E
            } else if (origin[i + 1] === 0x5D) {
                des[desLength++] = 0x5E
            } else {
                logger.error(`unexpect buffer at [${i}]`, origin)
                return null
            }

            i += 2
            continue
        }

        des[desLength++] = origin[i++]
    }

    return des.slice(0, desLength)
}