import { Module } from '@nestjs/common';
import { VideoController } from './video/video.controller';
import { VideoService } from './video/video.service';
import { VideoModule } from './video/video.module';

@Module({
  imports: [VideoModule],
  controllers: [VideoController],
  providers: [VideoService],
})
export class AppModule {}
