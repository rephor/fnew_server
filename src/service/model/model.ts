import { DataType, Parameter } from '../../common/define'

export class Device {
    constructor(public  id: string, public  name: string, public parentId: string,
                public ip: string, public subcommand: string, public type: string, public children: Array<Device>) {
    }
}

export class ParamModel extends Parameter{
    constructor(public readonly command: number, public readonly type: DataType | number, public value: string | number,
                public  localValue: string | number, public readonly name: string ) {
        super( command, type , value )
    }
}