import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Logger Module
 * Provides structured logging with correlation ID support
 */
@Global()
@Module({
    providers: [LoggerService],
    exports: [LoggerService],
})
export class LoggerModule { }
