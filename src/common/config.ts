// tslint:disable-next-line
const config = require('../../config/config.json')

function getConfig(key): any {
    return config[key]
}

export { config, getConfig }
