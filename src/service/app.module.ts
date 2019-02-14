import { Module } from '@nestjs/common'
import { DeviceModule } from './device/device.module'
import { ParameterModule } from './parameter/parameter.module'
import { ConfigModule } from './config/config.module'

@Module({
    imports: [
        ConfigModule,
        DeviceModule,
        ParameterModule,
    ],
})

export class ApplicationModule {
}
