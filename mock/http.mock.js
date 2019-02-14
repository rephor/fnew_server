import { getLogger } from "log4js"
import { crc16 } from "../src/sbi/common/package"

const http = require('http')

const logger = getLogger('http')

export function init(config) {
    const server = http.createServer((req, res) => {
        logger.info('get req', req.method, req.url)

        if (req.url === '/upgrade' && req.method === 'POST') {
            if (!req.headers.hasOwnProperty('crc')) {
                logger.error('not found crc')
                return
            }

            const length = +req.headers['content-length']
            let base64Buffer = Buffer.alloc(0)

            req.on('data', (data) => {
                base64Buffer = Buffer.concat([base64Buffer, data])

                if (base64Buffer.length < length) {
                    logger.info(`receive ${base64Buffer.length} expect ${length}`)
                    return
                }

                if (base64Buffer.length > length) {
                    logger.error(`version length error ${base64Buffer.length}, expect ${length}`)
                    return
                }

                const versionBuffer = Buffer.from(base64Buffer.toString(), 'base64')

                const crc = crc16(versionBuffer)
                if (+req.headers.crc !== crc) {
                    logger.error(`crc not match ${req.headers.crc} != ${crc}`)
                    return
                }

                logger.info(`receive finish: buffer length ${versionBuffer.length}, after base64 length ${base64Buffer.length}, crc ${crc}`)

                const fs = require('fs')
                const fd = fs.openSync('mock/upgrade', 'w+')
                fs.writeSync(fd, versionBuffer, 0)

                res.setHeader('Content-Type', 'text/html')
                res.writeHead(200, {'Content-Type': 'text/plain'})

                res.end(data)
            })
        }
    })

    server.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
    })

    server.listen(config.port)
}
