'use strict'

const path = require('path')
const fs = require('fs')
const winston = new require('winston')
const logPath = path.resolve(__dirname, 'logs')
try {
    fs.mkdirSync(logPath)  
}
catch (err) { 
}
const infoLogFile = path.resolve(logPath, 'info.log')
const warnLogFile = path.resolve(logPath, 'warn.log')
const errorLogFile = path.resolve(logPath, 'error.log')
const accessLogFile = path.resolve(logPath, 'access.log')

const logTimestamp = function() {
    return new Date().toISOString()
}

const logFormatter = function(options) {
    // - Return string will be passed to logger.
    // - Optionally, use options.colorize(options.level, <string>) to
    //   colorize output based on the log level.
    return options.timestamp() + ' ' +
      config.colorize(options.level, options.level.toUpperCase()) + ' ' +
      (options.message ? options.message : '') +
      (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
}

const config = winston.config;
const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: logTimestamp,
            formatter: logFormatter
        }),
        new (winston.transports.File)({ 
            name: 'infoLog',
            level: 'info',
            filename: infoLogFile,
            timestamp: logTimestamp,
            formatter: logFormatter
        }),
        new (winston.transports.File)({
            name: 'errorLog',
            level: 'error',
            filename: errorLogFile,
            timestamp: logTimestamp,
            formatter: logFormatter
        }),
        new (winston.transports.File)({
            name: 'accessLog',
            level: 'access',
            filename: accessLogFile,
            timestamp: logTimestamp,
            formatter: logFormatter
        })
    ]
})

module.exports = logger

