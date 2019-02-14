import { decode } from "../src/sbi/common/decoder"

describe('decoder test suit', () => {
    afterEach(() => {
    })

    it('test decoder', () => {
        // encode('abcde', 0x8fff, Buffer.from('xxxxxx'))

        const {body, deviceId, syncId} = decode(Buffer.from([126, 5, 97, 98, 99, 100, 101, 255, 143, 120, 120, 120, 120, 120, 120, 209, 212, 126]))

        expect(body).toEqual(Buffer.from('xxxxxx'))
        expect(deviceId).toEqual(Buffer.from('abcde'))
        expect(syncId).toEqual(0xfff)
    })

    it('test decoder empty body', () => {
        // encode('abcde', 0x8fff))

        const {body, deviceId, syncId} = decode(Buffer.from([126, 5, 97, 98, 99, 100, 101, 255, 143, 179, 224, 126]))

        expect(body.length).toEqual(0)
        expect(deviceId).toEqual(Buffer.from('abcde'))
        expect(syncId).toEqual(0xfff)
    })
})
