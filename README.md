## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Short Form Video Upload Service

NestJS 기반의 비디오 업로드 서비스입니다. Google Cloud Storage를 사용하여 비디오 파일과 메타데이터를 관리합니다.

## 🚀 기능

- **비디오 업로드**: 웹 인터페이스를 통한 비디오 파일 업로드
- **메타데이터 관리**: 제목, 설명, 태그, 카테고리 등 메타데이터 저장
- **GCS 연동**: Google Cloud Storage에 자동 업로드
- **파일 구조화**: 연도/월별 폴더 구조로 정리
- **API 제공**: RESTful API를 통한 비디오 관리

## 📁 프로젝트 구조

```
short-form/
├── src/
│   ├── video/
│   │   ├── interfaces/
│   │   │   └── video-metadata.interface.ts  # 메타데이터 인터페이스
│   │   ├── video.controller.ts              # 업로드 API 컨트롤러
│   │   ├── video.service.ts                 # GCS 업로드 서비스
│   │   └── video.module.ts                  # 비디오 모듈
│   └── main.ts                              # 애플리케이션 진입점
├── public/
│   └── upload.html                          # 업로드 웹 페이지
└── env.example                              # 환경 변수 예시
```

## 🛠️ 설치 및 설정

### 1. 의존성 설치

```bash
yarn install
```

### 2. Google Cloud Storage 설정

#### GCP 프로젝트 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 생성
2. Cloud Storage API 활성화
3. 서비스 계정 생성 및 JSON 키 파일 다운로드
4. GCS 버킷 생성

#### 환경 변수 설정

```bash
# .env 파일 생성
cp env.example .env
```

`.env` 파일을 편집하여 다음 정보를 입력하세요:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=./gcp-key.json
GCS_BUCKET_NAME=your-bucket-name
PORT=3000
NODE_ENV=development
```

### 3. 서비스 계정 키 파일 배치

다운로드한 JSON 키 파일을 프로젝트 루트에 `gcp-key.json`으로 저장하세요.

## 🚀 실행

### 개발 모드

```bash
yarn start:dev
```

### 프로덕션 모드

```bash
yarn build
yarn start:prod
```

## 🔧 API 문서

Swagger UI를 통해 API 문서를 확인할 수 있습니다:

- URL: `http://localhost:3000/api`

## 📝 메타데이터 구조

```json
{
  "title": "비디오 제목",
  "description": "비디오 설명",
  "tags": ["태그1", "태그2"],
  "category": "교육",
  "uploadDate": "2024-01-15T10:30:00Z",
  "fileSize": 52428800,
  "format": "mp4",
  "videoUrl": "gs://bucket-name/videos/2024/01/video-title.mp4",
  "publicUrl": "https://storage.googleapis.com/bucket-name/videos/2024/01/video-title.mp4"
}
```

## ⚠️ 주의사항

- 최대 파일 크기: 100MB
- 지원 형식: MP4, MOV, AVI, MKV 등
- 파일명은 자동으로 안전한 형태로 변환됩니다
- 업로드된 파일은 공개 URL로 접근 가능합니다

## 🐛 문제 해결

### GCS 인증 오류

- 서비스 계정 키 파일이 올바른 위치에 있는지 확인
- 환경 변수 `GOOGLE_CLOUD_KEY_FILE` 경로 확인

### 업로드 실패

- 파일 크기가 100MB 이하인지 확인
- 지원되는 비디오 형식인지 확인
- 네트워크 연결 상태 확인

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
