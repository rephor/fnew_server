import { getLogger } from 'log4js'
import * as http from 'http'
import { crc16 } from '../package'
import { getConfig } from '../../../common/config'

let port: number = null
const logger = getLogger('http')
const config = getConfig('http')

export async function send(versionBuffer: Buffer, ip: string): Promise<boolean> {
    return new Promise<boolean>(((resolve, reject) => {
        const crc = crc16(versionBuffer)
        const base64 = versionBuffer.toString('base64')
        logger.info(`start send version: buffer length ${versionBuffer.length}, after base64 length ${base64.length}, crc ${crc}`)

        const opt = {
            method: 'POST',
            host: ip,
            port,
            path: '/upgrade',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': base64.length,
                crc,
            },
        }

        const timer = setTimeout(() => {
            logger.error('send time out')
            reject(new Error('发送超时'))
        }, Math.floor(config.timeout))

        timer.unref()

        const req = http.request(opt, (serverFeedback) => {
            logger.info(`send version end, statusCode`, serverFeedback.statusCode)
            resolve(serverFeedback.statusCode === 200)
        })
        req.write(base64)
        req.end()
    }))
}

export function onChange(newPort: number) {
    port = newPort
}