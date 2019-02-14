import { onReceive } from "./protocol.mock"
import { getLogger } from "log4js"

const dgram = require('dgram')
const serverSocket = dgram.createSocket('udp4')

const logger = getLogger('udp.mock')

export function init(config) {
    serverSocket.on('message', function (msg, rinfo) {
        const response = onReceive(msg)
        if (response === null) {
            return
        }

        serverSocket.send(response, 0, response.length, rinfo.port, rinfo.address)
    })

    serverSocket.on('error', function (err) {
        logger.info('error, msg - %s, stack - %s\n', err.message, err.stack)
    })

    serverSocket.on('listening', function () {
        logger.info(`echo server is listening on port ${config.port}`)
    })

    serverSocket.bind(config.port)
}

