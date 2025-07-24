import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import {
  UploadVideoDto,
  VideoMetadata,
} from './interfaces/video-metadata.interface';

/**
 * 비디오 업로드 및 조회 컨트롤러
 * 비디오 파일 업로드와 메타데이터 조회 API를 제공합니다.
 */
@Controller('video')
@ApiTags('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * 비디오 파일 업로드 엔드포인트
   *
   * @param file - 업로드된 비디오 파일 (Multer 미들웨어에서 처리)
   * @param metadata - 비디오 메타데이터 (제목, 설명, 태그, 카테고리)
   * @returns 업로드된 비디오의 메타데이터
   *
   * @example
   * POST /video/upload
   * Content-Type: multipart/form-data
   *
   * Form Data:
   * - video: [비디오 파일]
   * - title: "비디오 제목"
   * - description: "비디오 설명"
   * - category: "교육"
   * - tags: "태그1,태그2,태그3"
   */
  @ApiOperation({
    summary: '비디오 업로드',
    description: '비디오 파일과 메타데이터를 업로드하여 GCS에 저장합니다.',
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('video')) // 'video' 필드명으로 파일 업로드 처리
  async uploadVideo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 최대 100MB
          new FileTypeValidator({ fileType: 'video/*' }), // 비디오 파일만 허용
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() metadata: UploadVideoDto,
  ): Promise<VideoMetadata> {
    return this.videoService.uploadVideo(file, metadata);
  }

  /**
   * 모든 비디오 목록 조회 엔드포인트
   *
   * @returns 업로드된 모든 비디오의 메타데이터 배열 (최신순 정렬)
   *
   * @example
   * GET /video
   *
   * Response:
   * [
   *   {
   *     "title": "비디오 제목",
   *     "description": "비디오 설명",
   *     "tags": "cat1,23,3",
   *     "category": "교육",
   *     "uploadDate": "2025-07-24T14:48:03.064Z",
   *     "fileSize": 675106,
   *     "format": "mp4",
   *     "videoUrl": "gs://short-form-project/videos/2025/07/cat.mp4",
   *     "publicUrl": "https://storage.googleapis.com/short-form-project/videos/2025/07/cat.mp4"
   *   }
   * ]
   */
  @ApiOperation({
    summary: '모든 비디오 목록 조회',
    description:
      '업로드된 모든 비디오의 메타데이터를 최신순으로 정렬하여 반환합니다.',
  })
  @Get()
  async getAllVideos(): Promise<VideoMetadata[]> {
    return this.videoService.getAllVideos();
  }

  /**
   * 랜덤 비디오 선택 엔드포인트
   *
   * @param count - 선택할 비디오 개수 (쿼리 파라미터, 기본값: 5)
   * @returns 랜덤 선택된 비디오 메타데이터 배열
   *
   * @example
   * GET /video/random?count=3
   *
   * Response:
   * [
   *   {
   *     "title": "cat",
   *     "description": "cat",
   *     "tags": "cat1,23,3",
   *     "category": "교육",
   *     "uploadDate": "2025-07-24T14:48:03.064Z",
   *     "fileSize": 675106,
   *     "format": "mp4",
   *     "videoUrl": "gs://short-form-project/videos/2025/07/cat.mp4",
   *     "publicUrl": "https://storage.googleapis.com/short-form-project/videos/2025/07/cat.mp4"
   *   }
   * ]
   */
  @ApiOperation({
    summary: '랜덤 비디오 선택',
    description:
      '업로드된 비디오 중에서 랜덤으로 선택된 비디오 목록을 반환합니다.',
  })
  @Get('random')
  async getRandomVideos(
    @Query('count') count?: string,
  ): Promise<VideoMetadata[]> {
    const countNum = count ? parseInt(count, 10) : 5;
    return this.videoService.getRandomVideos(countNum);
  }
}
