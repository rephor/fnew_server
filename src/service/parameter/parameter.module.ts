import { Module } from '@nestjs/common'
import { ParameterController, RemoteController } from './parameter.controller'
import { ParameterService } from './parameter.service'

@Module({
    controllers: [ParameterController, RemoteController ],
    providers: [ParameterService],
})
export class ParameterModule {
}
