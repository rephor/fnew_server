import { Body, Controller, Delete, FileInterceptor, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common'

import { getResponse, MyResponse } from '../common/response'
import { getTree } from '../common/memory.db'
import { Device } from '../model/model'
import { isStringEmpty } from '../../common/util'
import { DeviceService } from './device.service'
import { isIPv4 } from 'net'

@Controller('device')
export class DeviceController {

    constructor(private readonly deviceService: DeviceService) {}

    @Get()
    getTree(){
        return new MyResponse<object>(0, getTree(), '')
    }

    @Post()
    add(@Body() device: Device){
        if (isStringEmpty ( device.id ) || isStringEmpty ( device.ip ) || isStringEmpty ( device.name ) ||
            isStringEmpty ( device.parentId ) || isStringEmpty ( device.parentId ) ) {
            return getResponse('缺少必要参数', device)
        }

        if ( !isIPv4(device.ip) ) {
            return getResponse('请注意IP格式', device)
        }

        const result = this.deviceService.add(device)
        return getResponse(result, device)
    }

    @Put(':id')
    update(@Param('id') id, @Body() device: Device){
        if ( isStringEmpty ( id ) ) {
            return getResponse('缺少必要参数', device)
        }

        if ( !isIPv4(device.ip) ) {
            return getResponse('请注意IP格式', device)
        }

        const result = this.deviceService.update(id, device)
        return getResponse(result, device)
    }

    @Delete(':id')
    delete(@Param('id') id){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        const result = this.deviceService.delete(id)
        return getResponse(result, {})
    }

    @Put(':id/id')
    async getId(@Param('id') id){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        const result: Map<string, any> = await this.deviceService.getDeviceId(id)
        return getResponse(result.get('status').toString(), result.get('data'))
    }

    @Post('/version/:id')
    @UseInterceptors(FileInterceptor('file'))
    async upgrade(@Param('id') id, @UploadedFile() file){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        try {
            const result: string = await this.deviceService.upgrade(id, file)
            return getResponse(result, {})
        } catch ( e ) {
            return getResponse(e.message, {})
        }
    }

    @Delete('/version/:id')
    async regression(@Param('id') id){
        if ( isStringEmpty ( id ) )
            return getResponse('缺少必要参数', id)

        try {
            const result = await this.deviceService.rollback(id)
            return getResponse(result, {})
        } catch ( e ) {
            return getResponse(e.message, {})
        }
    }

}