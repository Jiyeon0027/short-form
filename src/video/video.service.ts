import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

import {
  VideoMetadata,
  UploadVideoDto,
} from './interfaces/video-metadata.interface';

/**
 * 비디오 업로드 및 관리 서비스
 * Google Cloud Storage를 사용하여 비디오 파일과 메타데이터를 관리합니다.
 */
@Injectable()
export class VideoService {
  /** 로거 인스턴스 */
  private readonly logger = new Logger(VideoService.name);

  /** Google Cloud Storage 클라이언트 */
  private storage: Storage;

  /** GCS 버킷 이름 */
  private bucketName: string;

  constructor() {
    // GCS 설정 - 환경변수나 설정 파일에서 가져와야 함
    this.storage = new Storage({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || './gcp-key.json',
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id',
    });
    this.bucketName = process.env.GCS_BUCKET_NAME || 'your-bucket-name';
  }

  /**
   * 비디오 파일을 GCS에 업로드하고 메타데이터를 생성합니다.
   *
   * @param file - 업로드할 비디오 파일 (Multer에서 제공)
   * @param metadata - 비디오 메타데이터 (제목, 설명, 태그 등)
   * @returns 생성된 메타데이터 객체
   */
  async uploadVideo(
    file: Express.Multer.File,
    metadata: UploadVideoDto,
  ): Promise<VideoMetadata> {
    try {
      // tags 검증 - 문자열로 들어오면 배열로 변환
      if (metadata.tags && typeof metadata.tags === 'string') {
        metadata.tags = (metadata.tags as string)
          .split(',')
          .map((tag) => tag.trim());
      }

      const bucket = this.storage.bucket(this.bucketName);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // 안전한 파일명 생성 (특수문자 제거, 공백을 하이픈으로 변경)
      const safeTitle = this.sanitizeFileName(metadata.title);
      const fileName = `${safeTitle}.${this.getFileExtension(file.originalname)}`;
      const gcsPath = `videos/${year}/${month}/${fileName}`;

      this.logger.log(`업로드 시작: ${fileName}`);

      // 비디오 파일을 GCS에 업로드
      const blob = bucket.file(gcsPath);
      const blobStream = blob.createWriteStream({
        resumable: false, // 작은 파일의 경우 false로 설정하여 빠른 업로드
        contentType: file.mimetype,
        metadata: {
          metadata: {
            title: metadata.title,
            uploadDate: now.toISOString(),
          },
        },
      });

      // 파일 업로드 완료 대기 (Promise로 래핑)
      await new Promise<void>((resolve, reject) => {
        blobStream.on('finish', () => {
          this.logger.log(`비디오 업로드 완료: ${gcsPath}`);
          resolve();
        });
        blobStream.on('error', (error) => {
          this.logger.error(`업로드 실패: ${error.message}`);
          reject(error);
        });
        blobStream.end(file.buffer);
      });

      // 공개 URL 생성 (버킷 레벨 권한에 의존)
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${gcsPath}`;
      this.logger.log(`파일 업로드 완료: ${gcsPath}`);
      this.logger.log(`공개 URL: ${publicUrl}`);

      // 메타데이터 JSON 생성
      const videoMetadata: VideoMetadata = {
        title: metadata.title,
        description: metadata.description || '',
        tags: metadata.tags || [],
        category: metadata.category || '',
        uploadDate: now.toISOString(),
        fileSize: file.size,
        format: this.getFileExtension(file.originalname),
        videoUrl: `gs://${this.bucketName}/${gcsPath}`,
        publicUrl: publicUrl,
      };

      // 메타데이터 JSON 파일을 GCS에 업로드
      const metadataPath = `videos/${year}/${month}/metadata/${safeTitle}.json`;
      await bucket
        .file(metadataPath)
        .save(JSON.stringify(videoMetadata, null, 2), {
          contentType: 'application/json',
        });

      this.logger.log(`메타데이터 업로드 완료: ${metadataPath}`);

      return videoMetadata;
    } catch (error) {
      this.logger.error(`업로드 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  /**
   * GCS에서 모든 비디오의 메타데이터를 조회합니다.
   *
   * @returns 비디오 메타데이터 배열 (최신순으로 정렬)
   */
  async getAllVideos(): Promise<VideoMetadata[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName);

      // videos/ 폴더 내의 모든 파일 조회
      const [files] = await bucket.getFiles({ prefix: 'videos/' });

      // 메타데이터 JSON 파일만 필터링
      const metadataFiles = files.filter(
        (file) =>
          file.name.includes('/metadata/') && file.name.endsWith('.json'),
      );

      const videos: VideoMetadata[] = [];

      // 각 메타데이터 파일을 다운로드하여 파싱
      for (const file of metadataFiles) {
        const [content] = await file.download();
        const metadata: VideoMetadata = JSON.parse(content.toString());
        videos.push(metadata);
      }

      // 업로드 날짜 기준으로 최신순 정렬
      return videos.sort(
        (a, b) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(),
      );
    } catch (error) {
      this.logger.error(`비디오 목록 조회 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 특정 비디오의 메타데이터를 제목으로 조회합니다.
   *
   * @param title - 조회할 비디오의 제목
   * @returns 비디오 메타데이터 또는 null (찾지 못한 경우)
   */
  async getVideoById(title: string): Promise<VideoMetadata | null> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const safeTitle = this.sanitizeFileName(title);

      // 메타데이터 파일 찾기 (와일드카드 사용)
      const [files] = await bucket.getFiles({
        prefix: `videos/*/metadata/${safeTitle}.json`,
      });

      if (files.length === 0) {
        return null;
      }

      // 첫 번째 파일의 내용을 다운로드하여 파싱
      const [content] = await files[0].download();
      return JSON.parse(content.toString());
    } catch (error) {
      this.logger.error(`비디오 조회 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 랜덤으로 비디오를 선택합니다.
   *
   * @param count - 선택할 비디오 개수 (기본값: 5)
   * @returns 랜덤 선택된 비디오 메타데이터 배열
   */
  async getRandomVideos(count: number = 5): Promise<VideoMetadata[]> {
    try {
      // 모든 비디오 목록 가져오기
      const allVideos = await this.getAllVideos();

      if (allVideos.length === 0) {
        return [];
      }

      // 요청한 개수가 전체 개수보다 많으면 전체 반환
      const maxCount = Math.min(count, allVideos.length);

      // 랜덤 선택 (Fisher-Yates 셔플 알고리즘)
      const shuffled = [...allVideos];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // 처음 count개 반환
      return shuffled.slice(0, maxCount);
    } catch (error) {
      this.logger.error(`랜덤 비디오 선택 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 파일명을 안전한 형태로 변환합니다.
   * 특수문자를 제거하고 공백을 하이픈으로 변경합니다.
   *
   * @param title - 원본 제목
   * @returns 안전한 파일명
   */
  private sanitizeFileName(title: string): string {
    return title
      .replace(/[^a-zA-Z0-9가-힣\s-]/g, '') // 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈만 허용)
      .replace(/\s+/g, '-') // 공백을 하이픈으로 변경
      .toLowerCase(); // 소문자로 변환
  }

  /**
   * 파일명에서 확장자를 추출합니다.
   *
   * @param filename - 원본 파일명
   * @returns 파일 확장자 (소문자)
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'mp4';
  }
}
