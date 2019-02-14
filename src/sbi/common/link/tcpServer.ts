import { getLogger } from 'log4js'
import { createServer, Socket } from 'net'
import { getConfig } from '../../../common/config'
import { decode } from '../decoder'
import { encode } from '../encoder'
import { isBufferEmpty } from '../../../common/util'

const logger = getLogger('TCP')
const config = getConfig('tcp')
let port: number = null
const socketMap = new Map<string, Socket>()
const server = createServer((sock) => {
    logger.info(`connect from remote ${sock.remoteAddress}:${sock.remotePort}`)

    if (socketMap.has(sock.remoteAddress)) {
        logger.warn(`reconnect from remote ${sock.remoteAddress}`)
        if (!socketMap.get(sock.remoteAddress).destroyed) {
            logger.warn(`destroy remote ${sock.remoteAddress}, because of reconnect`)
            socketMap.get(sock.remoteAddress).destroy()
        }

        socketMap.delete(sock.remoteAddress)
    }

    sock.on('data', (data: Buffer) => {
        try {
            const {body, syncId, deviceId} = decode(data)
            if (isBufferEmpty(body) || body.length !== 1) {
                logger.error(`receive unexpect body ${body} from ${sock.remoteAddress}`)
                return
            }

            let message = null
            if (body[0] === 1) {
                message = 'login'
            } else if (body[0] === 2) {
                message = 'heartbeat'
            } else {
                logger.error(`receive unexpect command ${body[0]}`)
                return
            }

            logger.debug(`receive ${message}`)
            sock.write(encode(deviceId, syncId, body))
        } catch (e) {
            logger.error('on data error', e)
        }
    })

    socketMap.set(sock.remoteAddress, sock)

    sock.unref()
    sock.setTimeout(config.heartbeat)

    sock.on('timeout', () => {
        logger.warn(`remote ${sock.remoteAddress} no heartbeat`)
        sock.destroy()
        socketMap.delete(sock.remoteAddress)
    })

    sock.on('close', (hadError: boolean) => {
        if (hadError) {
            logger.info(`remote ${sock.remoteAddress} closed with error`)
        } else {
            logger.debug(`remote ${sock.remoteAddress} closed`)
        }
    })

    sock.on('error', (err: Error) => {
        logger.error(`remote ${sock.remoteAddress} error`, err)
    })
})

server.on('listening', () => {
    logger.info('tcp server on listening')
})

export function listen() {
    logger.info(`listen on port ${port}`)
    server.listen(port, '0.0.0.0')
}

export function close() {
    socketMap.forEach((value: Socket, key: string) => {
        if (!value.destroyed) {
            logger.info(`destroy remote ${key} by tcp close`)
            value.destroy()
        }
    })

    socketMap.clear()

    server.close(() => {
        logger.info('on close')
    })
}

export function send(ip: string, data: Buffer): Promise<Buffer> {
    if (!socketMap.has(ip)) {
        logger.error(`can not found socket with ip ${ip}`)
        return Promise.reject(new Error(`ip地址${ip}没有tcp连接`))
    }

    if (socketMap.get(ip).destroyed) {
        logger.error(`socket with ip ${ip} destroyed`)
        socketMap.delete(ip)
        return Promise.reject(new Error(`ip地址${ip}的tcp连接已经断开`))
    }

    return new Promise<Buffer>((resolve, reject) => {
        socketMap.get(ip).write(data, () => {
            socketMap.get(ip).on('data', (buffer: Buffer) => {
                resolve(buffer)
            })
        })

        const timer = setTimeout(() => {
            logger.error('send time out')
            reject(new Error('发送超时'))
        }, Math.floor(config.timeout))

        timer.unref()
    })
}

export function onChange(newPort: number) {
    port = newPort
}