import SerialPort = require('serialport')
import { getLogger } from 'log4js'
import { getConfig } from '../../../common/config'

const logger = getLogger('com')
const config = getConfig('com')
let path: string = null
let baudRate: 115200 | 57600 | 38400 | 19200 | 9600 | 4800 | 2400 = null
let dataBits: 8 | 7 | 6 | 5 = null
let parity: 'none' | 'even' | 'mark' | 'odd' | 'space' = null
let stopBits: 1 | 2 = null

export function send(message: Buffer | string): Promise<Buffer> {

    return new Promise<Buffer>(((resolve, reject) => {
        logger.debug('start open', path, baudRate, dataBits, parity, stopBits)
        const serialPort = new SerialPort(path, {
            autoOpen: false,
            baudRate,
            dataBits,
            parity,
            stopBits,
        })

        const sendTimer = setTimeout(() => {
            logger.error('send time out')
            closeWithReject(new Error('发送超时'))
        }, Math.floor(config.timeout))

        function close(ending, parameter) {
            if (!serialPort.isOpen) {
                ending(parameter)
                return
            }

            const closeTimer = setTimeout(() => {
                logger.error('close time out')
                reject('com关闭超时')
            }, Math.floor(config.timeout))

            logger.debug('start close')
            serialPort.close((error) => {
                if (error) {
                    logger.debug('close error', error)
                }

                clearTimeout(closeTimer)
                logger.debug('closed')
                ending(parameter)
            })
        }

        function closeWithReject(errorMessage: Error) {
            close(reject, errorMessage)
        }

        function closeWithResolve(receivedData) {
            clearTimeout(sendTimer)

            close(resolve, receivedData)
        }

        serialPort.open((err) => {
            if (err || !serialPort.isOpen) {
                logger.error('open failed', err, serialPort.isOpen)
                closeWithReject(new Error('com口打开失败'))
            }

            serialPort.write(message, (error) => {
                if (error) {
                    logger.error(`write failed`, error)
                    closeWithReject(new Error('com口写入失败'))
                }

                logger.debug('send OK, waiting response')
            })
        })

        serialPort.on('data', (data) => {
            closeWithResolve(data)
        })

        serialPort.on('error', (error) => {
            logger.error('error: ' + error)
            closeWithReject(new Error('com错误'))
        })
    }))
}

export function onChange(newPath: string, newBaudRate: 115200 | 57600 | 38400 | 19200 | 9600 | 4800 | 2400,
                         newDataBits: 8 | 7 | 6 | 5, newParity: 'none' | 'even' | 'mark' | 'odd' | 'space',
                         newStopBits: 1 | 2) {
    path = newPath
    baudRate = newBaudRate
    dataBits = newDataBits
    parity = newParity
    stopBits = newStopBits
}