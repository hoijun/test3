const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'votes.json');

// 미들웨어 설정
app.use(express.urlencoded({ extended: true })); // POST 데이터 파싱
app.use(express.json());
app.use(cookieParser()); // 쿠키 파싱
app.use(express.static('public')); // 정적 파일 제공

// 투표 데이터 읽기 함수
function readVotes() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('투표 데이터 읽기 실패:', error);
    return { jjajangmyeon: 0, jjamppong: 0 };
  }
}

// 투표 데이터 쓰기 함수
function writeVotes(votes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(votes, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('투표 데이터 쓰기 실패:', error);
    return false;
  }
}

// 루트 경로 - /vote로 리다이렉트
app.get('/', (req, res) => {
  res.redirect('/vote');
});

// GET /vote - 투표 페이지 제공
app.get('/vote', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'vote.html'));
});

// POST /vote - 투표 처리
app.post('/vote', (req, res) => {
  const { choice } = req.body;

  // 쿠키 확인 (어뷰징 방지)
  if (req.cookies.voted) {
    return res.send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>이미 투표하셨습니다</title>
        </head>
        <body>
          <h1>이미 투표하셨습니다!</h1>
          <p>중복 투표는 허용되지 않습니다.</p>
          <a href="/result">결과 보기</a>
        </body>
      </html>
    `);
  }

  // 선택값 검증
  if (choice !== 'jjajangmyeon' && choice !== 'jjamppong') {
    return res.status(400).send('잘못된 선택입니다.');
  }

  // 투표 데이터 업데이트
  const votes = readVotes();
  votes[choice]++;

  if (writeVotes(votes)) {
    // 쿠키 설정 (24시간 유지)
    res.cookie('voted', 'true', { maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/result');
  } else {
    res.status(500).send('투표 처리 중 오류가 발생했습니다.');
  }
});

// GET /result - 결과 페이지
app.get('/result', (req, res) => {
  const votes = readVotes();
  const total = votes.jjajangmyeon + votes.jjamppong;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>투표 결과</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          h1 {
            color: #333;
          }
          .result {
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .vote-count {
            font-size: 24px;
            margin: 10px 0;
          }
          .emoji {
            font-size: 30px;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          a:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <h1>투표 결과</h1>
        <div class="result">
          <div class="vote-count">
            <span class="emoji">🍜</span> 짜장면: <strong>${votes.jjajangmyeon}</strong>표
          </div>
          <div class="vote-count">
            <span class="emoji">🍲</span> 짬뽕: <strong>${votes.jjamppong}</strong>표
          </div>
          <div style="margin-top: 20px; color: #666;">
            총 투표 수: ${total}표
          </div>
        </div>
        <a href="/vote">다시 투표하기</a>
      </body>
    </html>
  `);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`투표 페이지: http://localhost:${PORT}/vote`);
  console.log(`결과 페이지: http://localhost:${PORT}/result`);
});
