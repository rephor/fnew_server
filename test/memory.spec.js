import {
    getTree,
    initTree,
    deviceMap,
    checkExist,
    isNumber,
    getTableId,
    changeDevice, removeDevice
} from "../src/service/common/memory.db"
import {Device} from "../src/service/model/model";


describe('util test suit', () => {

    afterEach(() => {
        deviceMap = {}
    });

    it('test init tree ', () => {
        deviceMap = {
            '12345':
                {
                    id: '12345',
                    name: '12345',
                    parentId: 'b721c',
                    ip: '127.0.0.1',
                    subcommand:
                        '3073, 3074, 3, 4, 513, 514',
                    type: '子设备',
                    children: []
                },
            '45658':
                {
                    id: '45658',
                    name: '45678',
                    parentId: 'b721c',
                    ip: '182.16.3.2',
                    subcommand: '',
                    type: '子设备',
                    children: []
                },
            '45678':
                {
                    id: '45678',
                    name: '设备子设备21',
                    parentId: '12568',
                    ip: '120.2.2.1',
                    subcommand: '',
                    type: '子设备',
                    children: []
                },
            '98345':
                {
                    id: '98345',
                    name: '天津天津111111111111111111111111111111',
                    parentId: '天津11111111',
                    ip: '162.5.2.2',
                    subcommand: '',
                    type: '主',
                    children: []
                }
        };
        initTree();
        const tree = getTree();
        expect(tree.hasOwnProperty(12568)).toEqual(true);
        expect(tree['12568'].length !== 0).toEqual(true);
        tree['12568'].forEach( v=>{
            expect(v.hasOwnProperty('id')).toEqual(true)
        })
    });

    it('test check device id exist  ', () => {
        deviceMap = {
            '12345':
                {
                    id: '12345',
                    name: '12345',
                    parentId: 'b721c',
                    ip: '127.0.0.1',
                    subcommand:
                        '3073, 3074, 3, 4, 513, 514',
                    type: '子设备',
                    children: []
                },
            '45658':
                {
                    id: '45658',
                    name: '45678',
                    parentId: 'b721c',
                    ip: '182.16.3.2',
                    subcommand: '',
                    type: '子设备',
                    children: []
                },
            '45678':
                {
                    id: '45678',
                    name: '设备子设备21',
                    parentId: '12568',
                    ip: '120.2.2.1',
                    subcommand: '',
                    type: '子设备',
                    children: []
                },
            '98345':
                {
                    id: '98345',
                    name: '天津天津111111111111111111111111111111',
                    parentId: '天津11111111',
                    ip: '162.5.2.2',
                    subcommand: '',
                    type: '主',
                    children: []
                }
        };
        expect(checkExist('98345')).toEqual(true);
        expect(checkExist('98346')).toEqual(false)
    });

    it('test check isNumber ', () => {
        expect(isNumber('123')).toEqual(true);
        expect(isNumber('aaa')).toEqual(false)
    });

    it('test check getTableId ', () => {
        expect(getTableId('123')).toEqual('3');
        expect(getTableId('562')).toEqual('2');
        expect(getTableId('3562')).toEqual('6');
    });

    it('test check changeDevice ', () => {
        deviceMap = {
            '12345':
                {
                    id: '12345',
                    name: '12345',
                    parentId: 'b721c',
                    ip: '127.0.0.1',
                    subcommand:
                        '3073, 3074, 3, 4, 513, 514',
                    type: '子设备',
                    children: []
                }
        };
        const device = new Device('abcde', '12345','b721c', '127.0.0.1', '3073, 3074, 3, 4, 513, 514', '子设备', [] );
        changeDevice('12345', device);
        expect(deviceMap.hasOwnProperty('abcde')).toEqual(true);
        expect(deviceMap['abcde'].id).toEqual('abcde');

    });

    it('test check removeDevice child', () => {
        deviceMap = {
            '12345':
                {
                    id: '12345',
                    name: '12345',
                    parentId: 'b721c',
                    ip: '127.0.0.1',
                    subcommand:
                        '3073, 3074, 3, 4, 513, 514',
                    type: '子设备',
                    children: []
                },
            'b721c':
                {
                    id: 'b721c',
                    name: '主设备',
                    parentId: '北京',
                    ip: '127.0.0.1',
                    subcommand:
                        '3073, 3074, 3, 4, 513, 514',
                    type: '主设备',
                    children: []
                }
        };
        removeDevice('12345');
        expect(deviceMap.hasOwnProperty('12345')).toEqual(false);
        expect(deviceMap.hasOwnProperty('b721c')).toEqual(true);

    })

    it('test check removeDevice parent', () => {
        deviceMap = {
            '12345':
                {
                    id: '12345',
                    name: '12345',
                    parentId: 'b721c',
                    ip: '127.0.0.1',
                    subcommand:
                        '3073, 3074, 3, 4, 513, 514',
                    type: '子设备',
                    children: []
                },
            'b721c':
                {
                    id: 'b721c',
                    name: '主设备',
                    parentId: '北京',
                    ip: '127.0.0.1',
                    subcommand:
                        '3073, 3074, 3, 4, 513, 514',
                    type: '主设备',
                    children: [{
                        id: '12345',
                        name: '12345',
                        parentId: 'b721c',
                        ip: '127.0.0.1',
                        subcommand:
                            '3073, 3074, 3, 4, 513, 514',
                        type: '子设备',
                        children: []
                    }]
                }
        };
        removeDevice('b721c');
        expect(deviceMap.hasOwnProperty('12345')).toEqual(false);
        expect(deviceMap.hasOwnProperty('b721c')).toEqual(false);

    })

});
