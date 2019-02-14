import { init as udpInit } from './udp.mock'
import { init as tcpInit } from './tcp.mock'
import { init as comInit } from './com.mock'
import { init as httpInit } from './http.mock'
import { configure } from 'log4js'
import { init } from './protocol.mock'

configure('config/log4js.json')

// tslint:disable-next-line
const config = require('./config.mock.json')

init()

switch (config.connect) {
    case 'udp':
        udpInit(config.udp)
        break
    case 'tcp':
        tcpInit(config.tcp)
        break
    case 'com':
        comInit(config.com)
        break
    default:
}

httpInit(config.http)