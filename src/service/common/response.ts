export class MyResponse<T> {

    constructor(public status: Number, public data: T, public message: String) {
        this.status = status
        this.data = data
        this.message = message
    }
}

export function getResponse(result: string, returnObj: any): MyResponse<any> {
    if ( result === 'ok')
        return new MyResponse<any>(0, returnObj, 'ok')
    else
        return new MyResponse<any>(-1, returnObj, result)
}