import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentVariables } from '../config/environment.validation';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): TypeOrmModuleOptions => {
        const connectionLimit = config.getOrThrow<number>('MYSQL_CONNECTION_LIMIT');

        return {
          type: 'mysql' as const,
          host: config.getOrThrow<string>('MYSQL_HOST'),
          port: config.getOrThrow<number>('MYSQL_PORT'),
          username: config.getOrThrow<string>('MYSQL_USER'),
          password: config.getOrThrow<string>('MYSQL_PASSWORD'),
          database: config.getOrThrow<string>('MYSQL_DATABASE'),
          ssl: config.getOrThrow<boolean>('MYSQL_SSL') ? { rejectUnauthorized: true } : undefined,
          extra: {
            connectionLimit,
            // mysql2 only starts its idle-connection cleanup when maxIdle is
            // below connectionLimit. Recycle remote DB sockets before NAT or
            // the database closes them while the API is idle.
            maxIdle: Math.max(0, connectionLimit - 1),
            idleTimeout: 60_000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10_000,
            waitForConnections: true,
          },
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
          logging: config.getOrThrow<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
          timezone: 'Z',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
