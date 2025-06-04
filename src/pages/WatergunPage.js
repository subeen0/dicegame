import React, { useState, useEffect, useRef } from 'react';
import { Snowflake, Users, Trophy, Target } from 'lucide-react';

const SnowballFightGame = () => {
  const [gameState, setGameState] = useState({
    teamA: { name: '빨간팀', clicks: 0, members: [] },
    teamB: { name: '파란팀', clicks: 0, members: [] },
    gameActive: false,
    timeLeft: 0,
    winner: null
  });
  
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [joined, setJoined] = useState(false);
  const [clickEffect, setClickEffect] = useState({ show: false, x: 0, y: 0 });
  const wsRef = useRef(null);
  const gameAreaRef = useRef(null);

  // WebSocket 연결 (실제 배포시에는 환경변수 사용)
  const WS_URL = process.env.NODE_ENV === 'production' 
    ? 'wss://your-railway-app.up.railway.app/ws' 
    : 'ws://localhost:3001/ws';

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket 연결됨');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket 연결 종료');
        // 재연결 시도
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket 에러:', error);
      };
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      // 재연결 시도
      setTimeout(connectWebSocket, 3000);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'gameState':
        setGameState(data.gameState);
        break;
      case 'playerJoined':
        setGameState(prev => ({
          ...prev,
          [data.team]: {
            ...prev[data.team],
            members: [...prev[data.team].members, data.playerName]
          }
        }));
        break;
      case 'clickUpdate':
        setGameState(prev => ({
          ...prev,
          [data.team]: {
            ...prev[data.team],
            clicks: data.clicks
          }
        }));
        break;
      case 'gameEnd':
        setGameState(prev => ({
          ...prev,
          gameActive: false,
          winner: data.winner
        }));
        break;
    }
  };

  const sendWebSocketMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const joinTeam = () => {
    if (!playerName.trim() || !selectedTeam) return;
    
    sendWebSocketMessage({
      type: 'joinTeam',
      playerName: playerName.trim(),
      team: selectedTeam
    });
    
    setJoined(true);
  };

  const handleSnowballClick = (event) => {
    if (!gameState.gameActive || !joined) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 클릭 이펙트 표시
    setClickEffect({ show: true, x, y });
    setTimeout(() => setClickEffect({ show: false, x: 0, y: 0 }), 300);

    // 서버에 클릭 전송
    sendWebSocketMessage({
      type: 'click',
      team: selectedTeam,
      playerName
    });
  };

  const startGame = () => {
    sendWebSocketMessage({ type: 'startGame' });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <Snowflake className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">우리동네 눈싸움</h1>
            <p className="text-gray-600">팀을 선택하고 눈덩이를 클릭하세요!</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedTeam('teamA')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedTeam === 'teamA'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2"></div>
                  <div className="font-semibold">빨간팀</div>
                  <div className="text-sm text-gray-500">{gameState.teamA.members.length}명 참여</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTeam('teamB')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedTeam === 'teamB'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <div className="font-semibold">파란팀</div>
                  <div className="text-sm text-gray-500">{gameState.teamB.members.length}명 참여</div>
                </div>
              </button>
            </div>

            <button
              onClick={joinTeam}
              disabled={!playerName.trim() || !selectedTeam}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              게임 참여하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4">
      {/* 상단 점수판 */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-3 items-center">
            {/* 빨간팀 */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-6 h-6 bg-red-500 rounded-full mr-2"></div>
                <h3 className="text-xl font-bold text-red-700">빨간팀</h3>
              </div>
              <div className="text-3xl font-bold text-red-600">{gameState.teamA.clicks.toLocaleString()}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
                <Users className="w-4 h-4 mr-1" />
                {gameState.teamA.members.length}명
              </div>
            </div>

            {/* 중앙 타이머 */}
            <div className="text-center">
              {gameState.gameActive ? (
                <div>
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    {formatTime(gameState.timeLeft)}
                  </div>
                  <div className="text-sm text-gray-600">게임 진행중</div>
                </div>
              ) : gameState.winner ? (
                <div>
                  <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-800">
                    {gameState.winner === 'teamA' ? '빨간팀' : '파란팀'} 승리!
                  </div>
                </div>
              ) : (
                <button
                  onClick={startGame}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  게임 시작
                </button>
              )}
            </div>

            {/* 파란팀 */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full mr-2"></div>
                <h3 className="text-xl font-bold text-blue-700">파란팀</h3>
              </div>
              <div className="text-3xl font-bold text-blue-600">{gameState.teamB.clicks.toLocaleString()}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
                <Users className="w-4 h-4 mr-1" />
                {gameState.teamB.members.length}명
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 게임 영역 */}
      <div className="max-w-4xl mx-auto">
        <div 
          ref={gameAreaRef}
          className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 min-h-96 flex items-center justify-center cursor-pointer"
          onClick={handleSnowballClick}
        >
          {/* 클릭 이펙트 */}
          {clickEffect.show && (
            <div
              className="absolute pointer-events-none"
              style={{ left: clickEffect.x, top: clickEffect.y }}
            >
              <div className="animate-ping">
                <Snowflake className="w-8 h-8 text-white" />
              </div>
            </div>
          )}

          {/* 중앙 눈덩이 */}
          <div className="text-center">
            <div className="relative">
              <Target className="w-32 h-32 text-white/80 mx-auto mb-4 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Snowflake className="w-16 h-16 text-white animate-spin" />
              </div>
            </div>
            
            {gameState.gameActive ? (
              <div className="text-white text-xl font-semibold">
                클릭해서 눈덩이를 던져보세요!
              </div>
            ) : (
              <div className="text-white/80 text-lg">
                게임이 시작되기를 기다리는 중...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 팀 정보 */}
      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4">
          <h4 className="font-bold text-red-700 mb-3 flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            빨간팀 멤버
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {gameState.teamA.members.map((member, idx) => (
              <div key={idx} className="text-gray-700 text-sm">• {member}</div>
            ))}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4">
          <h4 className="font-bold text-blue-700 mb-3 flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            파란팀 멤버
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {gameState.teamB.members.map((member, idx) => (
              <div key={idx} className="text-gray-700 text-sm">• {member}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnowballFightGame;