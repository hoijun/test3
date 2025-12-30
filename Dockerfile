# Node.js 20 LTS 버전 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (프로덕션 모드)
RUN npm ci --only=production

# 애플리케이션 소스 복사
COPY . .

# 데이터 디렉토리 생성
RUN mkdir -p /app/data

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "app.js"]
