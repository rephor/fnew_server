import { checkParameter, isStringEmpty, sleep } from '../src/common/util'
import { DataType, Parameter } from "../src/common/define"

describe('util test suit', () => {
    it('test isStringEmpty for null pointer', () => {
        expect(isStringEmpty(null)).toBe(true)
    })

    it('test test isStringEmpty for 0 length string', () => {
        expect(isStringEmpty('')).toBe(true)
    })

    it('test test isStringEmpty for normal string', () => {
        expect(isStringEmpty('test')).toBe(false)
    })

    it('test sleep', async () => {
        const timeout = 60
        const now = Date.now()
        await sleep(timeout)
        const diff = Date.now() - now
        expect(diff).toBeGreaterThanOrEqual(timeout)
    })

    it('test check', () => {
        expect(checkParameter(new Parameter(0, DataType.uint8, 0x100))).toEqual(false)
        expect(checkParameter(new Parameter(0, DataType.uint16, 0x10000))).toEqual(false)
        expect(checkParameter(new Parameter(0, DataType.uint32, 0x100000000))).toEqual(false)
        expect(checkParameter(new Parameter(0, DataType.sint8, -0x100))).toEqual(false)
        expect(checkParameter(new Parameter(0, DataType.sint16, -0x10000))).toEqual(false)
        expect(checkParameter(new Parameter(0, DataType.sint32, -0x100000000))).toEqual(false)
        expect(checkParameter(new Parameter(0, 5, 0))).toEqual(false)
        expect(checkParameter(new Parameter(0, DataType.sint32, 'a'))).toEqual(false)
        expect(checkParameter(new Parameter(0, 5, '中国'))).toEqual(false)
        expect(checkParameter(new Parameter(0, 9, '中国'))).toEqual(true)
    })
})
