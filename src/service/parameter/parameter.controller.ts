import { Body, Controller, Get, Param, Put } from '@nestjs/common'

import { ParameterService } from './parameter.service'
import { isStringEmpty } from '../../common/util'
import { getResponse, MyResponse } from '../common/response'

@Controller('parameter')
export class ParameterController {

    constructor(private readonly parameterService: ParameterService) {}

    @Put('/:id/ordinary')
    async ordinary(@Param('id') id ){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        try {
            const result = await this.parameterService.getOrdinary(id)
            return getResponse('ok', result)
        } catch ( e ) {
            return getResponse(e.message, {})
        }
    }

    @Put('/:id/debug')
    async debug(@Param('id') id ){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        try {
            const result = await this.parameterService.getDebug(id)
            return getResponse('ok', result)
        } catch ( e ) {
            return getResponse(e.message, {})
        }
    }

    @Get(':id')
    getParameters(@Param('id') id ){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        return new MyResponse<object>(0, this.parameterService.getAllParams(id), '')
    }

    @Put('/:id/remote')
    async remote(@Param('id') id, @Body('key') keys: Array<number>){
        if ( isStringEmpty ( id ) || keys.length === 0 )
            return getResponse('缺少必要参数', id)

        try {
            const result = await this.parameterService.remote(id, keys)
            return getResponse(result, {})
        } catch ( e ) {
            return getResponse(e.message, {})
        }
    }

    @Put('/:id/local')
    async local(@Param('id') id, @Body() o: object){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        try {
            const result = await this.parameterService.local(id, o)
            return getResponse(result, {})
        } catch ( e ) {
            return getResponse(e.message, {})
        }
    }

}

@Controller('remote')
export class RemoteController {

    constructor(private readonly parameterService: ParameterService) {}

    @Put('/:id')
    async remote(@Param('id') id, @Body('key') keys: Array<number>){
        if ( isStringEmpty ( id ) || keys.length === 0 )
            return getResponse('缺少必要参数', id)
        try {
            const result = await this.parameterService.setRemote(id, keys)
            return getResponse(result, {})
        } catch ( e ) {
            return getResponse(e.message, {})
        }
    }
}