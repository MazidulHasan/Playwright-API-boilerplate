// src/utilities/logger.js

// Basic console logger (replace with Winston or Pino for advanced features like file logging, formatting)

/* eslint-disable no-console */

// Determine log level (e.g., from environment variable)
const logLevel = process.env.LOG_LEVEL || 'info'; // Default to 'info'
const levels = { 'debug': 1, 'info': 2, 'warn': 3, 'error': 4 };
const currentLevel = levels[logLevel.toLowerCase()] || levels['info'];

export const logger = {
  debug: (message, ...args) => {
    if (currentLevel <= levels['debug']) {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, args.length > 0 ? args : '');
    }
  },
  info: (message, ...args) => {
    if (currentLevel <= levels['info']) {
      console.info(`[INFO] ${new Date().toISOString()}: ${message}`, args.length > 0 ? args : '');
    }
  },
  warn: (message, ...args) => {
    if (currentLevel <= levels['warn']) {
      console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, args.length > 0 ? args : '');
    }
  },
  error: (message, ...args) => {
    if (currentLevel <= levels['error']) {
      // Log error object details if present
      const errorDetails = args.find(arg => arg instanceof Error);
      const otherArgs = args.filter(arg => !(arg instanceof Error));
      console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, otherArgs.length > 0 ? otherArgs : '', errorDetails ? `\n${errorDetails.stack || errorDetails}` : '');
    }
  },
};

// --- Example using Winston (Install winston: npm install winston) ---
/*
import winston from 'winston';
import path from 'path';

// Define log directory relative to this file's location -> project_root/logs
const logDir = path.resolve(__dirname, '../../logs');

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Log stack traces
        winston.format.splat(),
        winston.format.json() // Log in JSON format for files
    ),
    defaultMeta: { service: 'api-automation' }, // Add default metadata
    transports: [
        // Log errors to error.log file
        new winston.transports.File({
            filename: path.join(logDir,'error.log'),
            level: 'error'
        }),
        // Log all levels to combined.log file
        new winston.transports.File({ filename: path.join(logDir,'combined.log') })
    ],
    exitOnError: false, // Do not exit on handled exceptions
});

// If not in production, also log to the console with simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(), // Add colors
        winston.format.printf(({ level, message, timestamp, stack }) => {
            return `${timestamp} ${level}: ${stack || message}`;
        })
    ),
    level: process.env.CONSOLE_LOG_LEVEL || 'debug', // Allow separate console level
  }));
}
*/
