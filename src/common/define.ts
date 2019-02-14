// put the common definition here

export const ENCODING = 'utf8'

export enum DataType {
    bit = 'bit',
    uint8 = 'uint8',
    uint16 = 'uint16',
    uint32 = 'uint32',
    sint8 = 'sint8',
    sint16 = 'sint16',
    sint32 = 'sint32',
}

export const enum LinkType {
    com = 'com',
    udp = 'udp',
    tcp = 'tcp',
}

export class Parameter {
    constructor(public readonly command: number, public readonly type: DataType | number, public readonly value: string | number) {
    }
}

export interface Config {
    connectionMode: LinkType
    httpPort: number
    tcpPort: number
    udpPort: number
    comPath: string
    comBaudRate: 115200|57600|38400|19200|9600|4800|2400
    comDataBits: 8|7|6|5
    comParity: 'none'|'even'|'mark'|'odd'|'space'
    comStopBits: 1|2
}

export interface Command {
    type: DataType | number
    description: string
}
