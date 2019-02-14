import { DataType, ENCODING, Parameter } from './define'

export async function sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

export function isStringEmpty(string: string): boolean {
    return string === null || string.length === 0
}

export function isBufferEmpty(buffer: Buffer): boolean {
    return !Buffer.isBuffer(buffer) || buffer.length === 0
}

export function checkParameter(parameter: Parameter): boolean {
    if (typeof parameter.type === 'number' && typeof parameter.value === 'string') {
        return parameter.type >= Buffer.from(parameter.value, ENCODING).length
    } else if (typeof parameter.type !== 'number' && typeof parameter.value !== 'string') {
        const testBuffer = Buffer.alloc(10)
        try {
            switch (parameter.type) {
                case DataType.bit:
                    return parameter.value === 0 || parameter.value === 1
                case DataType.uint8:
                    testBuffer.writeUInt8(parameter.value, 0)
                    break
                case DataType.uint16:
                    testBuffer.writeUInt16LE(parameter.value, 0)
                    break
                case DataType.uint32:
                    testBuffer.writeUInt32LE(parameter.value, 0)
                    break
                case DataType.sint8:
                    testBuffer.writeInt8(parameter.value, 0)
                    break
                case DataType.sint16:
                    testBuffer.writeInt16LE(parameter.value, 0)
                    break
                case DataType.sint32:
                    testBuffer.writeInt32LE(parameter.value, 0)
                    break
                default:
                    return false
            }
        } catch (e) {
            return false
        }

        return true
    } else {
        return false
    }
}