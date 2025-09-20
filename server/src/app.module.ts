import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    UsersModule,
    FilesModule,
    // 生产环境下提供静态文件服务
    ...(isProd ? [
      ServeStaticModule.forRoot({
        rootPath: join(__dirname, '..', 'client'),
        exclude: ['/api*'],
      }),
    ] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}