import { getLogger } from "log4js"
import { onReceive } from "./protocol.mock"
import { encode } from "./code.mock"

const net = require('net')
const data = require('./data.mock.json')
let host = null
let port = null

const logger = getLogger('tcp.mock')
const client = new net.Socket()
let syncId = 0

function getSyncId() {
    syncId = (syncId + 1) % 0xfff

    return syncId
}

export function init(config) {
    host = config.host
    port = config.port

    client.connect(port, host, function () {
        logger.info('connect to: ' + host + ':' + port)

        client.write(encode(data.deviceId, getSyncId(), Buffer.from([1])))  // 登录报文

        setInterval(() => {
            logger.debug('send heart beat')
            client.write(encode(data.deviceId, getSyncId(), Buffer.from([2])))   // 心跳报文
        }, Math.floor(config.heartbeat))
    })

    client.on('data', function (data) {
        const response = onReceive(data)
        if (response === null) {
            return
        }

        client.write(response)
    })

    client.on('close', function () {
        logger.info('Connection closed')
    })
}