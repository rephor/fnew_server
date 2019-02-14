import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { ApplicationModule as AppModule } from '../../src/service/app.module'

describe('debug (e2e)', () => {
    let app

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    it('/debug (GET)', () => {
        return request(app.getHttpServer())
            .get('/debug')
            .expect(404)
    })
})
