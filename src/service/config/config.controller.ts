import { Body, Controller, Get, Put } from '@nestjs/common'

import { ConfigService } from './config.service'
import { getResponse, MyResponse } from '../common/response'
import { Config } from '../../common/define'

@Controller('setting')
export class ConfigController {

    constructor(private readonly configService: ConfigService) {}

    @Get()
    getSetting(){
        return new MyResponse<object>(0,  this.configService.getSetting(), '')
    }

    @Put()
    set(@Body() config: Config){
        const result = this.configService.setConfig( config )
        return getResponse(result, config)
    }

    @Get('/switch/')
    getShowId(){
        return new MyResponse<boolean>(0,  this.configService.isShowId(), '')
    }
}