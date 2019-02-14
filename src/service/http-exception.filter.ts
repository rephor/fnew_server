import { join } from 'path'
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

    constructor(private VuePathList) {
    }

    isVue(url: String) {
        for (const path of this.VuePathList) {
            if (url.startsWith(path)) {
                return true
            }
        }

        return false
    }

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse()
        const request = ctx.getRequest()

        if (exception.getStatus() === 404 && this.isVue(request.url)) {
            response.header('Content-Type', 'text/html')
            response.sendFile(join(__dirname, '..', 'public/index.html'))
        } else {
            response
                .status(exception.getStatus())
                .json({
                    statusCode: exception.getStatus(),
                    timestamp: new Date().toISOString(),
                    path: request.url,
                })
        }
    }
}
