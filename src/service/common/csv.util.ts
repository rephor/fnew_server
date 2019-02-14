import { getLogger } from 'log4js'
import { writeFile, readFileSync } from 'fs-extra'
import { isStringEmpty } from '../../common/util'
import { decode, encode } from 'iconv-lite'
import stringify = require('csv-stringify/lib/sync')
import parse = require('csv-parse/lib/sync')

const logger = getLogger('CSV')

export function readCsv(filepath: string ): Array<Array<string>> {
    logger.info(filepath, 'csv read start filepath: ', filepath)
    if ( isStringEmpty( filepath ) ) {
        logger.info(filepath, 'can not find the path')
        return null
    }

    const data = decode(readFileSync(filepath), 'gbk')
    let str = []

    try {
        str = parse(data.toString())
    }catch (e){
        logger.error(data, '数据不符合规范[readCsv]')
    }

    logger.info(filepath, 'csv read end')
    return str
}

export async function writeCsv(filepath: string, data){
    logger.info(filepath, 'csv write start : ' , ' data : ', data )
    try {
        const strData = stringify(data)
        await writeFile(filepath, encode(strData, 'gbk'))
        logger.info(filepath, 'csv write end')
    }catch (e){
        logger.error(data, '数据不符合规范[writeCsv]')
    }

}
