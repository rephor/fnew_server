import { backEscape, crc16, escape } from "../src/sbi/common/package"


describe('package test suit', () => {
    it('test crc', async () => {
        const ret = crc16(new Buffer('abcd'))
        expect(ret).toEqual(0xa836)
    })

    it('test crc with length', async () => {
        const ret = crc16(new Buffer('abcdef'), 4)
        expect(ret).toEqual(0xa836)
    })

    it('test crc, buffer is empty', async () => {
        try {
            void crc16(null)
            expect(true).toBe(false)
        } catch (e) {
            expect(e).not.toBeNull()
        }
    })

    it('test crc, length > buffer length', async () => {
        try {
            void crc16(new Buffer('abcdef'), 10)
            expect(true).toBe(false)
        } catch (e) {
            expect(e).not.toBeNull()
        }
    })

    it('test escape normal', () => {
        const ret = escape(Buffer.from('abcd'))

        expect(ret).toEqual(Buffer.from('abcd'))
    })

    it('test escape 5E change', () => {
        const ret = escape(Buffer.from('^abcd^'))

        expect(ret).toEqual(Buffer.from('^]abcd^]'))
    })

    it('test escape 7E change', () => {
        const ret = escape(Buffer.from('~abcd~'))

        expect(ret).toEqual(Buffer.from('^}abcd^}'))
    })

    it('test escape both 5E 7E change', () => {
        const ret = escape(Buffer.from('~ab^c^d~'))

        expect(ret).toEqual(Buffer.from('^}ab^]c^]d^}'))
    })

    it('test back escape normal', () => {
        const ret = backEscape(Buffer.from('abcdefgh'))

        expect(ret).toEqual(Buffer.from('abcdefgh'))
    })

    it('test back escape 5E change', () => {
        const ret = backEscape(Buffer.from('^]abcdefg^]'))

        expect(ret).toEqual(Buffer.from('^abcdefg^'))
    })

    it('test back escape 7E change', () => {
        const ret = backEscape(Buffer.from('^}abcdefg^}'))

        expect(ret).toEqual(Buffer.from('~abcdefg~'))
    })

    it('test back escape both 5E 7E change', () => {
        const ret = backEscape(Buffer.from('^}ab^]c^]d^}'))

        expect(ret).toEqual(Buffer.from('~ab^c^d~'))
    })

    it('test escape and back escape', () => {
        const escaped = escape(Buffer.from('~ab^c^d~'))
        const backEscaped = backEscape(escaped)

        expect(backEscaped).toEqual(Buffer.from('~ab^c^d~'))
    })

    it('test back escape invalid buffer', () => {
        expect(backEscape(Buffer.from('^'))).toBeNull()
        expect(backEscape(Buffer.from('~'))).toBeNull()
        expect(backEscape(Buffer.from('^a'))).toBeNull()
    })
})
