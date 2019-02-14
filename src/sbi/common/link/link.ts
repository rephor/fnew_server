import { onChange as onComChange, send as comSend } from './com'
import { onChange as onUdpChange, send as udpSend } from './udpClient'
import { onChange as onHttpChange } from './httpClient'
import { onChange as onTcpChange, send as tcpSend, close, listen } from './tcpServer'
import { getLogger } from 'log4js'
import { Config, LinkType } from '../../../common/define'

const logger = getLogger('link')
let currentLinkType: LinkType = null

export async function send(ip: string, data: Buffer): Promise<Buffer> {
    switch (currentLinkType) {
        case 'com':
            return await comSend(data)
        case 'udp':
            return await udpSend(ip, data)
        case 'tcp':
            return await tcpSend(ip, data)
    }
}

export function onConfigChange(newConfig: Config): void {
    logger.info('link config', newConfig)
    onComChange(newConfig.comPath, newConfig.comBaudRate, newConfig.comDataBits, newConfig.comParity, newConfig.comStopBits)
    onTcpChange(newConfig.tcpPort)
    onUdpChange(newConfig.udpPort)
    onHttpChange(newConfig.httpPort)
    onChange(newConfig.connectionMode)
}

function onChange(newLinkType: LinkType): void {
    if (currentLinkType === newLinkType) {
        logger.warn(`current link type is already ${currentLinkType}, no need to change`)
        return
    }

    if (currentLinkType === LinkType.tcp) {
        close()
    }

    if (newLinkType === LinkType.tcp) {
        listen()
    }

    currentLinkType = newLinkType
}
