import { encode } from "../src/sbi/common/encoder"

describe('encoder test suit', () => {
    afterEach(() => {
    })

    it('test encoder empty body', () => {
        const ret = encode(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff]), 0xfff)

        expect(ret).toEqual(Buffer.from([126, 5, 255, 255, 255, 255, 255, 255, 15, 15, 149, 126]))
    })
})
