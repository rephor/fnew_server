import { getLogger } from "log4js"
import { onReceive } from "./protocol.mock"

const SerialPort = require('serialport')

const logger = getLogger('com.mock')

export function init(config) {
    logger.info(config)
    const serialPort = new SerialPort(config.path, {
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        parity: config.parity,
        stopbits: config.stopBits,
    }, (err) => {
        if (err || !serialPort.isOpen) {
            logger.info('open filed', err)
        }

        serialPort.on('data', (data) => {
            const response = onReceive(data)
            if (response === null) {
                return
            }

            serialPort.write(response)
        })

        serialPort.on('error', (error) => {
            logger.error('error: ' + error)
            close()
        })

        serialPort.on('close', (error) => {
            logger.error('close: ' + error)
        })
    })

    function close() {
        if (!serialPort.isOpen) {
            return
        }

        logger.debug('close')
        serialPort.close()
    }
}
