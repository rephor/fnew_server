import { getDebugParameter, getDeviceId, getOrdinaryParameter, getParameter, rollback, setParameter } from "../src/sbi/protocol"
import { send } from "../src/sbi/common/link/link"
import { getSyncId } from "../src/sbi/common/package"
import { encode } from "../src/sbi/common/encoder"
import { DataType, ENCODING, Parameter } from "../src/common/define"

const back_getSyncId = getSyncId
const back_send = send
const normalDeviceId = 'abcde'
const normalSyncId = 0x500
const normalResponseSyncId = 0x8500
const normalIp = '127.0.0.1'

async function testSetParameter(parameterList) {
    getSyncId = jest.fn().mockReturnValueOnce(normalSyncId)
    send = jest.fn().mockReturnValueOnce(Promise.resolve(encode(normalDeviceId, normalResponseSyncId, createParameterSetBody(parameterList, 0x14))))

    const ret = await setParameter(normalIp, normalDeviceId, parameterList)

    expect(send).toBeCalledWith(normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, createParameterSetBody(parameterList, 0x14)))
    expect(getSyncId.mock.calls.length).toBe(1)

    expect(ret.length).toBe(0)
}

async function testGetParameter(parameterList) {
    getSyncId = jest.fn().mockReturnValueOnce(normalSyncId)
    send = jest.fn().mockReturnValueOnce(Promise.resolve(encode(normalDeviceId, normalResponseSyncId, createParameterSetBody(parameterList, 0x15))))

    const ret = await getParameter(normalIp, normalDeviceId, parameterList)

    expect(send).toBeCalledWith(normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, createParameterGetBody(parameterList)))
    expect(send.mock.calls.length).toBe(1)
    expect(getSyncId.mock.calls.length).toBe(1)

    checkParameterList(ret, parameterList)
}

// type self length + totally length (1B) + command length (2B)
function getTypeLength(type) {
    switch (type) {
        case DataType.bit:
        case DataType.uint8:
        case DataType.sint8:
            return 4    // 1 + 1 + 2
        case DataType.uint16:
        case DataType.sint16:
            return 5    // 2 + 1 + 2
        case DataType.uint32:
        case DataType.sint32:
            return 7    // 4 + 1 + 2
        default:
            return type + 3   // type + 1 + 2
    }
}

function createParameterGetBody(parameterList) {
    const body = getParameterBody(parameterList)

    body.writeUInt8(0x15, 0)

    let count = 1
    for (const parameter of parameterList) {
        body.writeUInt8(getTypeLength(parameter.type), count)
        count += 1
        body.writeUInt16LE(parameter.command, count)
        count += 2

        switch (parameter.type) {
            case DataType.bit:
            case DataType.uint8:
            case DataType.sint8:
                count += 1
                break

            case DataType.uint16:
            case DataType.sint16:
                count += 2
                break

            case DataType.uint32:
            case DataType.sint32:
                count += 4
                break

            default:
                count += parameter.type
        }
    }

    return body
}

function checkParameterList(expectedList, baseList) {
    expect(expectedList.length).toEqual(baseList.length)

    for (let i = 0; i < expectedList.length; i++) {
        expect(expectedList[i].command).toEqual(baseList[i].command)
        expect(expectedList[i].value).toEqual(baseList[i].value)
        expect(expectedList[i].result).toBeNull()
    }
}

function getParameterBody(parameterList) {
    let count = 1
    for (const parameter of parameterList) {
        count += getTypeLength(parameter.type)
    }

    return Buffer.alloc(count)
}

function createParameterSetBody(parameterList, command) {
    const body = getParameterBody(parameterList)

    body.writeUInt8(command, 0)

    let count = 1
    for (const parameter of parameterList) {
        body.writeUInt8(getTypeLength(parameter.type), count)
        count += 1
        body.writeUInt16LE(parameter.command, count)
        count += 2

        switch (parameter.type) {
            case DataType.bit:
            case DataType.uint8:
                body.writeUInt8(parameter.value, count)
                count += 1
                break

            case DataType.sint8:
                body.writeInt8(parameter.value, count)
                count += 1
                break

            case DataType.uint16:
                body.writeUInt16LE(parameter.value, count)
                count += 2
                break

            case DataType.sint16:
                body.writeInt16LE(parameter.value, count)
                count += 2
                break

            case DataType.uint32:
                body.writeUInt32LE(parameter.value, count)
                count += 4
                break

            case DataType.sint32:
                body.writeInt32LE(parameter.value, count)
                count += 4
                break

            default:
                body.write(parameter.value, count, parameter.type, ENCODING)
                count += parameter.type
        }
    }

    return body
}

describe('protocol test suit', () => {
    afterEach(() => {
        getSyncId = back_getSyncId
        send = back_send
    })

    it('test get device id', async () => {
        getSyncId = jest.fn().mockReturnValue(normalSyncId)
        send = jest.fn().mockImplementation(() => Promise.resolve(encode(normalDeviceId, normalResponseSyncId)))

        const ret = await getDeviceId(normalIp)

        expect(ret).toEqual(normalDeviceId)
        expect(send).toBeCalledWith(normalIp, encode(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff]), normalSyncId))
        expect(send.mock.calls.length).toEqual(1)
        expect(getSyncId.mock.calls.length).toEqual(1)
    })

    it('test get device id， syncId not match', async () => {
        getSyncId = jest.fn().mockReturnValue(normalSyncId + 1)
        send = jest.fn().mockImplementation(() => Promise.resolve(encode(normalDeviceId, normalResponseSyncId)))

        try {
            void await getDeviceId(normalIp)
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.message).toEqual('协议对接错误')
        }

        expect(send).toBeCalledWith(normalIp, encode(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff]), normalSyncId + 1))
        expect(send.mock.calls.length).toEqual(1)
        expect(getSyncId.mock.calls.length).toEqual(1)
    })

    it('test getOrdinaryParameter 1 page, 1 ids', async () => {
        const body = Buffer.alloc(5)
        body.writeUInt8(3, 0)
        body.writeUInt8(1, 1)
        body.writeUInt8(1, 2)
        body.writeUInt16LE(0x1234, 3)

        getSyncId = jest.fn().mockReturnValue(normalSyncId)
        send = jest.fn().mockImplementation(() => Promise.resolve(encode(normalDeviceId, normalResponseSyncId, body)))

        const ret = await getOrdinaryParameter(normalIp, normalDeviceId)

        expect(send).toBeCalledWith(normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, Buffer.from([3])))
        expect(send.mock.calls.length).toBe(1)
        expect(getSyncId.mock.calls.length).toEqual(1)
        expect(ret.length).toEqual(1)
        expect(ret[0]).toEqual(0x1234)
    })

    it('test getOrdinaryParameter 1 page, 3 ids', async () => {
        const body = Buffer.alloc(9)
        body.writeUInt8(3, 0)
        body.writeUInt8(1, 1)
        body.writeUInt8(1, 2)
        body.writeUInt16LE(0x1234, 3)
        body.writeUInt16LE(0x2345, 5)
        body.writeUInt16LE(0x3456, 7)

        getSyncId = jest.fn().mockReturnValue(normalSyncId)
        send = jest.fn().mockImplementation(() => Promise.resolve(encode(normalDeviceId, normalResponseSyncId, body)))

        const ret = await getOrdinaryParameter(normalIp, normalDeviceId)

        expect(send).toBeCalledWith(normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, Buffer.from([3])))
        expect(send.mock.calls.length).toBe(1)
        expect(getSyncId.mock.calls.length).toEqual(1)
        expect(ret.length).toEqual(3)
        expect(ret[0]).toEqual(0x1234)
        expect(ret[1]).toEqual(0x2345)
        expect(ret[2]).toEqual(0x3456)
    })

    it('test getOrdinaryParameter 2 page, 3 id', async () => {
        const bodyPage1 = Buffer.alloc(9)
        bodyPage1.writeUInt8(3, 0)
        bodyPage1.writeUInt8(2, 1)
        bodyPage1.writeUInt8(1, 2)
        bodyPage1.writeUInt16LE(0x1234, 3)
        bodyPage1.writeUInt16LE(0x2345, 5)
        bodyPage1.writeUInt16LE(0x3456, 7)

        const bodyPage2 = Buffer.alloc(9)
        bodyPage2.writeUInt8(3, 0)
        bodyPage2.writeUInt8(2, 1)
        bodyPage2.writeUInt8(2, 2)
        bodyPage2.writeUInt16LE(0x4567, 3)
        bodyPage2.writeUInt16LE(0x5678, 5)
        bodyPage2.writeUInt16LE(0x6789, 7)

        getSyncId = jest.fn().mockReturnValueOnce(normalSyncId).mockReturnValueOnce(normalSyncId + 1)
        send = jest.fn().mockReturnValueOnce(Promise.resolve(encode(normalDeviceId, normalResponseSyncId, bodyPage1)))
            .mockReturnValueOnce(Promise.resolve(encode(normalDeviceId, normalResponseSyncId + 1, bodyPage2)))

        const ret = await getOrdinaryParameter(normalIp, normalDeviceId)

        expect(send).nthCalledWith(1, normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, Buffer.from([3])))
        expect(send).nthCalledWith(2, normalIp, encode(Buffer.from(normalDeviceId), normalSyncId + 1, Buffer.from([3])))
        expect(send.mock.calls.length).toBe(2)
        expect(getSyncId.mock.calls.length).toEqual(2)
        expect(ret.length).toEqual(6)
        expect(ret[0]).toEqual(0x1234)
        expect(ret[1]).toEqual(0x2345)
        expect(ret[2]).toEqual(0x3456)
        expect(ret[3]).toEqual(0x4567)
        expect(ret[4]).toEqual(0x5678)
        expect(ret[5]).toEqual(0x6789)
    })

    it('test getDebugParameter 1 page, 1 ids', async () => {
        const body = Buffer.alloc(5)
        body.writeUInt8(4, 0)
        body.writeUInt8(1, 1)
        body.writeUInt8(1, 2)
        body.writeUInt16LE(0x1234, 3)

        getSyncId = jest.fn().mockReturnValue(normalSyncId)
        send = jest.fn().mockImplementation(() => Promise.resolve(encode(normalDeviceId, normalResponseSyncId, body)))

        const ret = await getDebugParameter(normalIp, normalDeviceId)

        expect(send).toBeCalledWith(normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, Buffer.from([4])))
        expect(send.mock.calls.length).toBe(1)
        expect(getSyncId.mock.calls.length).toEqual(1)
        expect(ret.length).toEqual(1)
        expect(ret[0]).toEqual(0x1234)
    })

    it('test getDebugParameter 1 page, 3 ids', async () => {
        const body = Buffer.alloc(9)
        body.writeUInt8(4, 0)
        body.writeUInt8(1, 1)
        body.writeUInt8(1, 2)
        body.writeUInt16LE(0x1234, 3)
        body.writeUInt16LE(0x2345, 5)
        body.writeUInt16LE(0x3456, 7)

        getSyncId = jest.fn().mockReturnValue(normalSyncId)
        send = jest.fn().mockImplementation(() => Promise.resolve(encode(normalDeviceId, normalResponseSyncId, body)))

        const ret = await getDebugParameter(normalIp, normalDeviceId)

        expect(send).toBeCalledWith(normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, Buffer.from([4])))
        expect(send.mock.calls.length).toBe(1)
        expect(getSyncId.mock.calls.length).toEqual(1)
        expect(ret.length).toEqual(3)
        expect(ret[0]).toEqual(0x1234)
        expect(ret[1]).toEqual(0x2345)
        expect(ret[2]).toEqual(0x3456)
    })

    it('test getDebugParameter 2 page, 3 id', async () => {
        const bodyPage1 = Buffer.alloc(9)
        bodyPage1.writeUInt8(4, 0)
        bodyPage1.writeUInt8(2, 1)
        bodyPage1.writeUInt8(1, 2)
        bodyPage1.writeUInt16LE(0x1234, 3)
        bodyPage1.writeUInt16LE(0x2345, 5)
        bodyPage1.writeUInt16LE(0x3456, 7)

        const bodyPage2 = Buffer.alloc(9)
        bodyPage2.writeUInt8(4, 0)
        bodyPage2.writeUInt8(2, 1)
        bodyPage2.writeUInt8(2, 2)
        bodyPage2.writeUInt16LE(0x4567, 3)
        bodyPage2.writeUInt16LE(0x5678, 5)
        bodyPage2.writeUInt16LE(0x6789, 7)

        getSyncId = jest.fn().mockReturnValueOnce(normalSyncId).mockReturnValueOnce(normalSyncId + 1)
        send = jest.fn().mockReturnValueOnce(Promise.resolve(encode(normalDeviceId, normalResponseSyncId, bodyPage1)))
            .mockReturnValueOnce(Promise.resolve(encode(normalDeviceId, normalResponseSyncId + 1, bodyPage2)))

        const ret = await getDebugParameter(normalIp, normalDeviceId)

        expect(send).nthCalledWith(1, normalIp, encode(Buffer.from(normalDeviceId), normalSyncId, Buffer.from([4])))
        expect(send).nthCalledWith(2, normalIp, encode(Buffer.from(normalDeviceId), normalSyncId + 1, Buffer.from([4])))
        expect(send.mock.calls.length).toBe(2)
        expect(getSyncId.mock.calls.length).toEqual(2)
        expect(ret.length).toEqual(6)
        expect(ret[0]).toEqual(0x1234)
        expect(ret[1]).toEqual(0x2345)
        expect(ret[2]).toEqual(0x3456)
        expect(ret[3]).toEqual(0x4567)
        expect(ret[4]).toEqual(0x5678)
        expect(ret[5]).toEqual(0x6789)
    })

    it('test rollback', async () => {
        getSyncId = jest.fn().mockReturnValueOnce(normalSyncId)
        send = jest.fn().mockReturnValueOnce(Promise.resolve(encode(normalDeviceId, normalResponseSyncId, Buffer.from([5]))))

        const ret = await rollback(normalIp, normalDeviceId)

        expect(ret).toEqual(true)
    })

    it('test getParameter bit', async () => {
        await testGetParameter([new Parameter(0x100, DataType.bit, 0x1)])
    })

    it('test getParameter uint8', async () => {
        await testGetParameter([new Parameter(0x100, DataType.uint8, 0x12)])
    })

    it('test getParameter sint8', async () => {
        await testGetParameter([new Parameter(0x100, DataType.sint8, -0x12)])
    })

    it('test getParameter uint16', async () => {
        await testGetParameter([new Parameter(0x100, DataType.uint16, 0x1234)])
    })

    it('test getParameter sint16', async () => {
        await testGetParameter([new Parameter(0x100, DataType.sint16, -0x1234)])
    })

    it('test getParameter uint32', async () => {
        await testGetParameter([new Parameter(0x100, DataType.uint32, 0x12345678)])
    })

    it('test getParameter sint32', async () => {
        await testGetParameter([new Parameter(0x100, DataType.sint32, -0x12345678)])
    })

    it('test getParameter string', async () => {
        await testGetParameter([new Parameter(0x100, 10, 'abcdefg')])
    })

    it('test getParameter max length string', async () => {
        await testGetParameter([new Parameter(0x100, 10, 'abcdefghij')])
    })

    it('test getParameter chinese string', async () => {
        await testGetParameter([new Parameter(0x100, 10, '中国字')])
    })

    it('test getParameter max length chinese string', async () => {
        await testGetParameter([new Parameter(0x100, 9, '中国字')])
    })

    it('test getParameter muti parameter', async () => {
        await testGetParameter([new Parameter(0x100, DataType.bit, 0x1),
            new Parameter(0x100, DataType.uint8, 0x12), new Parameter(0x100, DataType.sint8, -0x12),
            new Parameter(0x100, DataType.uint16, 0x1234), new Parameter(0x100, DataType.sint16, -0x1234),
            new Parameter(0x100, DataType.uint32, 0x12345678), new Parameter(0x100, DataType.sint32, -0x12345678),
            new Parameter(0x100, 10, 'abcdefg'), new Parameter(0x100, 10, 'abcdefghij'),
            new Parameter(0x100, 10, '中国字'), new Parameter(0x100, 9, '中国字')])
    })

    it('test setParameter bit', async () => {
        await testSetParameter([new Parameter(0x100, DataType.bit, 0x1)])
    })

    it('test setParameter uint8', async () => {
        await testSetParameter([new Parameter(0x100, DataType.uint8, 0x12)])
    })

    it('test setParameter sint8', async () => {
        await testSetParameter([new Parameter(0x100, DataType.sint8, -0x12)])
    })

    it('test setParameter uint16', async () => {
        await testSetParameter([new Parameter(0x100, DataType.uint16, 0x1234)])
    })

    it('test setParameter sint16', async () => {
        await testSetParameter([new Parameter(0x100, DataType.sint16, -0x1234)])
    })

    it('test setParameter uint32', async () => {
        await testSetParameter([new Parameter(0x100, DataType.uint32, 0x12345678)])
    })

    it('test setParameter sint32', async () => {
        await testSetParameter([new Parameter(0x100, DataType.sint32, -0x12345678)])
    })

    it('test setParameter string', async () => {
        await testSetParameter([new Parameter(0x100, 10, 'abcdefg')])
    })

    it('test setParameter max length string', async () => {
        await testSetParameter([new Parameter(0x100, 10, 'abcdefghij')])
    })

    it('test setParameter chinese string', async () => {
        await testSetParameter([new Parameter(0x100, 10, '中国字')])
    })

    it('test setParameter max length chinese string', async () => {
        await testSetParameter([new Parameter(0x100, 9, '中国字')])
    })

    it('test setParameter muti parameter', async () => {
        await testSetParameter([new Parameter(0x100, DataType.bit, 0x1),
            new Parameter(0x100, DataType.uint8, 0x12), new Parameter(0x100, DataType.sint8, -0x12),
            new Parameter(0x100, DataType.uint16, 0x1234), new Parameter(0x100, DataType.sint16, -0x1234),
            new Parameter(0x100, DataType.uint32, 0x12345678), new Parameter(0x100, DataType.sint32, -0x12345678),
            new Parameter(0x100, 10, 'abcdefg'), new Parameter(0x100, 10, 'abcdefghij'),
            new Parameter(0x100, 10, '中国字'), new Parameter(0x100, 9, '中国字')])
    })
})
