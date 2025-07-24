import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

// 환경변수 로드 (가장 먼저 실행되어야 함)
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * 애플리케이션 부트스트랩 함수
 * NestJS 애플리케이션을 생성하고 설정합니다.
 */
async function bootstrap() {
  // NestJS 애플리케이션 생성 (Express 기반)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 정적 파일 서빙 설정
  // public 폴더의 파일들을 루트 경로(/)로 서빙
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  // Swagger API 문서 설정
  const config = new DocumentBuilder()
    .setTitle('short form API')
    .setDescription('short form API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 서버 시작 (기본 포트: 3000)
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // 서버 시작 로그 출력
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger is running on port ${port}/api`);
  console.log(`Upload page is running on port ${port}/upload.html`);

  // 환경변수 로드 확인
  console.log('Environment variables loaded:');
  console.log(
    `- GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID || 'NOT SET'}`,
  );
  console.log(`- GCS_BUCKET_NAME: ${process.env.GCS_BUCKET_NAME || 'NOT SET'}`);
  console.log(
    `- GOOGLE_CLOUD_KEY_FILE: ${process.env.GOOGLE_CLOUD_KEY_FILE || 'NOT SET'}`,
  );
}

// 애플리케이션 시작
bootstrap();
