const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// 정적 파일 제공 (프론트엔드 빌드 파일)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// WebSocket 서버 설정
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// 게임 상태 관리
let gameState = {
  teamA: { 
    name: '빨간팀', 
    clicks: 0, 
    members: [] 
  },
  teamB: { 
    name: '파란팀', 
    clicks: 0, 
    members: [] 
  },
  gameActive: false,
  timeLeft: 0,
  winner: null,
  gameTimer: null
};

// 연결된 클라이언트들
const clients = new Map();

// 모든 클라이언트에게 메시지 브로드캐스트
function broadcast(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// 게임 상태 브로드캐스트
function broadcastGameState() {
  broadcast({
    type: 'gameState',
    gameState: {
      ...gameState,
      gameTimer: undefined // 타이머 객체는 제외
    }
  });
}

// 게임 시작
function startGame() {
  if (gameState.gameActive) return;

  // 게임 상태 초기화
  gameState.teamA.clicks = 0;
  gameState.teamB.clicks = 0;
  gameState.gameActive = true;
  gameState.timeLeft = 60; // 60초 게임
  gameState.winner = null;

  // 게임 타이머 시작
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
  }

  gameState.gameTimer = setInterval(() => {
    gameState.timeLeft--;
    
    if (gameState.timeLeft <= 0) {
      endGame();
    } else {
      broadcastGameState();
    }
  }, 1000);

  broadcastGameState();
}

// 게임 종료
function endGame() {
  gameState.gameActive = false;
  
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
    gameState.gameTimer = null;
  }

  // 승자 결정
  if (gameState.teamA.clicks > gameState.teamB.clicks) {
    gameState.winner = 'teamA';
  } else if (gameState.teamB.clicks > gameState.teamA.clicks) {
    gameState.winner = 'teamB';
  } else {
    gameState.winner = 'draw';
  }

  broadcast({
    type: 'gameEnd',
    winner: gameState.winner,
    finalScores: {
      teamA: gameState.teamA.clicks,
      teamB: gameState.teamB.clicks
    }
  });

  broadcastGameState();
}

// WebSocket 연결 처리
wss.on('connection', (ws, request) => {
  console.log('새로운 클라이언트 연결');

  // 클라이언트 정보 저장
  const clientId = Date.now() + Math.random();
  clients.set(ws, {
    id: clientId,
    playerName: null,
    team: null
  });

  // 현재 게임 상태 전송
  ws.send(JSON.stringify({
    type: 'gameState',
    gameState: {
      ...gameState,
      gameTimer: undefined
    }
  }));

  // 메시지 처리
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const client = clients.get(ws);

      switch (data.type) {
        case 'joinTeam':
          handleJoinTeam(ws, data, client);
          break;
          
        case 'click':
          handleClick(ws, data, client);
          break;
          
        case 'startGame':
          if (!gameState.gameActive) {
            startGame();
          }
          break;
          
        default:
          console.log('알 수 없는 메시지 타입:', data.type);
      }
    } catch (error) {
      console.error('메시지 처리 에러:', error);
    }
  });

  // 연결 종료 처리
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client && client.playerName && client.team) {
      // 팀에서 플레이어 제거
      const team = gameState[client.team];
      team.members = team.members.filter(name => name !== client.playerName);
      broadcastGameState();
    }
    clients.delete(ws);
    console.log('클라이언트 연결 종료');
  });

  ws.on('error', (error) => {
    console.error('WebSocket 에러:', error);
  });
});

// 팀 참가 처리
function handleJoinTeam(ws, data, client) {
  const { playerName, team } = data;
  
  if (!playerName || !team || !gameState[team]) {
    return;
  }

  // 기존에 다른 팀에 있었다면 제거
  if (client.team && client.playerName) {
    const oldTeam = gameState[client.team];
    oldTeam.members = oldTeam.members.filter(name => name !== client.playerName);
  }

  // 새 팀에 추가 (중복 체크)
  const targetTeam = gameState[team];
  if (!targetTeam.members.includes(playerName)) {
    targetTeam.members.push(playerName);
  }

  // 클라이언트 정보 업데이트
  client.playerName = playerName;
  client.team = team;

  // 참가 알림 브로드캐스트
  broadcast({
    type: 'playerJoined',
    playerName,
    team
  });

  broadcastGameState();
}

// 클릭 처리
function handleClick(ws, data, client) {
  const { team, playerName } = data;
  
  if (!gameState.gameActive || !team || !gameState[team]) {
    return;
  }

  // 클라이언트 검증
  if (client.team !== team || client.playerName !== playerName) {
    return;
  }

  // 클릭 수 증가
  gameState[team].clicks++;

  // 클릭 업데이트 브로드캐스트
  broadcast({
    type: 'clickUpdate',
    team,
    clicks: gameState[team].clicks,
    playerName
  });
}

// API 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    gameActive: gameState.gameActive,
    players: gameState.teamA.members.length + gameState.teamB.members.length
  });
});

app.get('/api/gamestate', (req, res) => {
  res.json({
    ...gameState,
    gameTimer: undefined
  });
});

// 게임 리셋 API (관리자용)
app.post('/api/reset', (req, res) => {
  gameState.teamA.clicks = 0;
  gameState.teamB.clicks = 0;
  gameState.teamA.members = [];
  gameState.teamB.members = [];
  gameState.gameActive = false;
  gameState.timeLeft = 0;
  gameState.winner = null;
  
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
    gameState.gameTimer = null;
  }

  broadcastGameState();
  res.json({ message: '게임이 리셋되었습니다.' });
});

// 프론트엔드 라우팅 (SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행중입니다.`);
  console.log(`WebSocket 서버: ws://localhost:${PORT}/ws`);
});

// 종료 시 정리
process.on('SIGTERM', () => {
  console.log('서버 종료 중...');
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
  }
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
  });
});

process.on('SIGINT', () => {
  console.log('서버 종료 중...');
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
  }
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
  });
});