import { AddressInfo } from 'net'
import { getLogger } from 'log4js'
import { getConfig } from '../../../common/config'
import { createSocket } from 'dgram'

const logger = getLogger('UDP')
const config = getConfig('udp')
let port: number = null

export function send(ip: string, message: Buffer | string): Promise<Buffer> {
    const client = createSocket('udp4')

    return new Promise<Buffer>((resolve, reject) => {
        if (typeof message === 'string') {
            message = new Buffer(message)
        }

        client.unref()

        client.bind(config.port, () => {
            client.setRecvBufferSize(1024)

            logger.debug('start send', message)
            client.send(message, port, ip, (err, bytes) => {

                logger.debug('send callback', err, bytes)
                if (err !== null) {
                    logger.error('send failed', err, bytes)
                    reject(new Error('udp消息发送失败'))
                }

                if (message.length !== bytes) {
                    reject(new Error('udp消息发送失败'))
                    logger.error(`send failed, ${message.length} != ${bytes}`)
                }

                logger.debug('send OK, waiting response')

                const timer = setTimeout(() => {
                    logger.error('send time out')
                    client.close()
                    reject(new Error('发送超时'))
                }, Math.floor(config.timeout))

                timer.unref()

                client.on('message', (msg: Buffer, rinfo: AddressInfo) => {
                    client.close()
                    logger.debug('receive', msg, rinfo)
                    resolve(msg)
                })

                client.on('close', () => clearTimeout(timer))

                client.on('error', (error: Error) => {
                    logger.error('send failed', error)
                    client.close()
                    reject(new Error('udp消息发送失败'))
                })
            })
        })
    })
}

export function onChange(newPort: number) {
    port = newPort
}