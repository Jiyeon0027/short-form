import { ApiProperty } from '@nestjs/swagger';
/**
 * 비디오 메타데이터 인터페이스
 * GCS에 저장되는 비디오 파일의 메타데이터 구조를 정의합니다.
 */
export class VideoMetadata {
  /** 비디오 제목 (필수) */
  title: string;

  /** 비디오 설명 (선택) */
  description?: string;

  /** 비디오 태그 배열 (선택) */
  tags?: string[];

  /** 비디오 카테고리 (선택) */
  category?: string;

  /** 업로드 날짜 (ISO 8601 형식) */
  uploadDate: string;

  /** 파일 크기 (바이트 단위) */
  fileSize: number;

  /** 비디오 재생 시간 (선택) */
  duration?: string;

  /** 비디오 해상도 (선택) */
  resolution?: string;

  /** 파일 형식 (mp4, mov, avi 등) */
  format: string;

  /** GCS 내부 URL (gs:// 형식) */
  videoUrl: string;

  /** 공개 접근 가능한 URL */
  publicUrl: string;

  /** 썸네일 이미지 URL (선택) */
  thumbnailUrl?: string;
}

/**
 * 비디오 업로드 시 사용되는 DTO 인터페이스
 * 클라이언트에서 서버로 전송되는 업로드 데이터 구조를 정의합니다.
 */
export class UploadVideoDto {
  /** 비디오 제목 (필수) */
  @ApiProperty({
    description: '비디오 제목',
    example: 'NestJS 튜토리얼',
  })
  title: string;

  /** 비디오 설명 (선택) */
  @ApiProperty({
    description: '비디오 설명',
    example: 'NestJS 프레임워크 사용법을 설명하는 비디오입니다.',
    required: false,
  })
  description?: string;

  /** 비디오 태그 배열 (선택) */
  @ApiProperty({
    description: '비디오 태그 배열 (문자열로 전송하면 에러 발생)',
    example: ['nestjs', 'tutorial', 'backend'],
    required: false,
    type: [String],
  })
  tags?: string[];

  /** 비디오 카테고리 (선택) */
  @ApiProperty({
    description: '비디오 카테고리',
    example: '교육',
    required: false,
  })
  category?: string;
}
