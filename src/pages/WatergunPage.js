import React, { useState, useEffect, useRef } from 'react';

const WaterGunGame = () => {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState([]);
  const [waterDrops, setWaterDrops] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(50);
  const [canShoot, setCanShoot] = useState(true);
  const [explosions, setExplosions] = useState([]); // 폭발 효과 상태 추가
  const gameAreaRef = useRef(null);
  const gameLoopRef = useRef(null);

  // 타겟 생성 (부드러운 움직임을 위한 개선)
  const createTarget = () => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 + 10; // 10-90% 범위
    const y = Math.random() * 40 + 10; // 10-50% 범위
    const speed = Math.random() * 1.5 + 0.5; // 속도 조정 (0.5-2)
    const direction = Math.random() * Math.PI * 2;
    
    return {
      id,
      x,
      y,
      size: Math.random() * 15 + 35, // 35-50px
      speed,
      direction,
      vx: Math.cos(direction) * speed * 0.3, // 부드러운 움직임을 위한 속도 벡터
      vy: Math.sin(direction) * speed * 0.3,
      bounceCount: 0, // 벽 반사 횟수
      rotation: Math.random() * 360, // 회전 각도
      rotationSpeed: (Math.random() - 0.5) * 2 // 회전 속도
    };
  };

  // 폭발 효과 생성
  const createExplosion = (x, y, targetSize) => {
    const particles = [];
    const particleCount = Math.floor(targetSize / 3) + 8; // 타겟 크기에 따른 파티클 수
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 3 + 2;
      const size = Math.random() * 4 + 2;
      
      particles.push({
        id: Date.now() + i,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        life: 60,
        maxLife: 60,
        color: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 5)]
      });
    }
    
    return {
      id: Date.now(),
      particles,
      x,
      y
    };
  };

  // 물줄기 생성 (연속된 물방울들)
  const createWaterStream = (startX, startY, targetX, targetY) => {
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const drops = [];
    const baseId = Date.now();
    
    // 물줄기를 위한 여러 개의 물방울 생성
    for (let i = 0; i < 10; i++) {
      drops.push({
        id: baseId + i,
        x: startX + (Math.cos(angle) * i * 2.5),
        y: startY + (Math.sin(angle) * i * 2.5),
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        life: 100 - (i * 4), // 뒤쪽 물방울은 더 빨리 사라짐
        streamIndex: i,
        size: Math.max(2, 6 - i * 0.3) // 앞쪽이 더 큰 물방울
      });
    }
    
    return drops;
  };

  // 게임 시작
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setWaterDrops([]);
    setExplosions([]);
    setPlayerPosition(50);
    setCanShoot(true);
  };

  // 게임 종료
  const endGame = () => {
    setGameState('gameOver');
    setTargets([]);
    setWaterDrops([]);
    setExplosions([]);
  };

  // 화면 터치/클릭 핸들러 (물줄기 발사)
  const handleShoot = (e) => {
    if (gameState !== 'playing' || !canShoot) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const clickX = ((e.clientX || e.touches[0].clientX) - rect.left) / rect.width * 100;
    const clickY = ((e.clientY || e.touches[0].clientY) - rect.top) / rect.height * 100;
    
    const startX = playerPosition;
    const startY = 85;
    
    const newStreamDrops = createWaterStream(startX, startY, clickX, clickY);
    setWaterDrops(prev => [...prev, ...newStreamDrops]);
    
    // 발사 쿨다운 설정 (500ms로 단축)
    setCanShoot(false);
    setTimeout(() => {
      setCanShoot(true);
    }, 500);
  };

  // 플레이어 이동 (터치 드래그)
  const handlePlayerMove = (e) => {
    if (gameState !== 'playing') return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const touchX = ((e.clientX || e.touches[0].clientX) - rect.left) / rect.width * 100;
    setPlayerPosition(Math.max(5, Math.min(95, touchX)));
  };

  // 충돌 감지 
  const checkCollision = (drop, target) => {
    const dx = drop.x - target.x;
    const dy = drop.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (target.size / 6); // 충돌 범위 조정
  };

  // 게임 루프
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // 타겟 업데이트 (부드러운 움직임과 벽 반사)
      setTargets(prev => {
        let updated = prev.map(target => {
          let newX = target.x + target.vx;
          let newY = target.y + target.vy;
          let newVx = target.vx;
          let newVy = target.vy;
          let newBounceCount = target.bounceCount;

          // 벽 반사 로직
          if (newX <= 5 || newX >= 95) {
            newVx = -newVx * 0.8; // 반사 시 속도 감소
            newX = Math.max(5, Math.min(95, newX));
            newBounceCount++;
          }
          if (newY <= 5 || newY >= 55) {
            newVy = -newVy * 0.8; // 반사 시 속도 감소
            newY = Math.max(5, Math.min(55, newY));
            newBounceCount++;
          }

          // 마찰력 적용 (부드러운 감속)
          newVx *= 0.999;
          newVy *= 0.999;

          // 너무 많이 반사되면 제거
          if (newBounceCount > 6) {
            return null;
          }

          return {
            ...target,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            bounceCount: newBounceCount,
            rotation: target.rotation + target.rotationSpeed
          };
        }).filter(target => target !== null);

        // 새 타겟 생성
        if (Math.random() < 0.04 && updated.length < 5) {
          updated.push(createTarget());
        }

        return updated;
      });

      // 물방울 업데이트
      setWaterDrops(prev => 
        prev.map(drop => ({
          ...drop,
          x: drop.x + drop.vx,
          y: drop.y + drop.vy,
          life: drop.life - 2,
          vy: drop.vy + 0.1 // 중력 효과
        })).filter(drop => 
          drop.life > 0 && 
          drop.x > -10 && drop.x < 110 && 
          drop.y > -10 && drop.y < 110
        )
      );

      // 폭발 파티클 업데이트
      setExplosions(prev => 
        prev.map(explosion => ({
          ...explosion,
          particles: explosion.particles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.98, // 감속
            vy: particle.vy * 0.98 + 0.05, // 중력
            life: particle.life - 1
          })).filter(particle => particle.life > 0)
        })).filter(explosion => explosion.particles.length > 0)
      );

      // 충돌 체크 (폭발 효과 추가)
      setTargets(prevTargets => {
        let newTargets = [...prevTargets];
        let scoreIncrease = 0;

        setWaterDrops(prevDrops => {
          let newDrops = [...prevDrops];
          
          for (let i = newDrops.length - 1; i >= 0; i--) {
            for (let j = newTargets.length - 1; j >= 0; j--) {
              if (checkCollision(newDrops[i], newTargets[j])) {
                // 폭발 효과 생성
                const explosion = createExplosion(
                  newTargets[j].x, 
                  newTargets[j].y, 
                  newTargets[j].size
                );
                setExplosions(prev => [...prev, explosion]);
                
                // 점수 추가
                scoreIncrease += Math.max(15, Math.floor(70 - newTargets[j].size));
                
                // 타겟과 물방울 제거
                newTargets.splice(j, 1);
                newDrops.splice(i, 1);
                break;
              }
            }
          }

          if (scoreIncrease > 0) {
            setScore(prev => prev + scoreIncrease);
          }

          return newDrops;
        });

        return newTargets;
      });
    }, 16); // 60fps

    return () => clearInterval(gameLoopRef.current);
  }, [gameState]);

  // 타이머
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center p-4">
      {gameState === 'start' && (
        <div className="text-center text-white">
          <h1 className='text-5xl mb-5 font-bold'>⚖️물의 여신의 심판</h1>
          <p className="text-lg mb-6 opacity-90">화면을 터치해 물풍선을 맞혀 점수를 획득하세요.</p>
          <button 
            onClick={startGame}
            className="bg-yellow-400 text-blue-800 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all duration-200 shadow-lg"
          >
            Start!
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-md h-full flex flex-col">
          <div className="flex justify-between items-center text-white text-lg font-bold mb-4 bg-black bg-opacity-20 rounded-lg px-4 py-2">
            <div>🏆 {score}점</div>
            <div>⏰ {timeLeft}초</div>
          </div>
          
          <div 
            ref={gameAreaRef}
            className="flex-1 bg-gradient-to-b from-sky-200 to-blue-100 rounded-lg relative overflow-hidden border-4 border-white shadow-xl"
            onTouchStart={handleShoot}
            onMouseDown={handleShoot}
            style={{ touchAction: 'none' }}
          >
            {/* 구름 */}
            <div className="absolute top-2 left-4 text-2xl animate-pulse">☁️</div>
            <div className="absolute top-6 right-8 text-xl animate-pulse" style={{animationDelay: '1s'}}>☁️</div>
            <div className="absolute top-12 left-1/2 text-lg animate-pulse" style={{animationDelay: '2s'}}>☁️</div>
            
            {/* 타겟들 (부드러운 애니메이션) */}
            {targets.map(target => (
              <div
                key={target.id}
                className="absolute flex items-center justify-center text-2xl transition-all duration-100 drop-shadow-lg"
                style={{
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                  transform: `translate(-50%, -50%) rotate(${target.rotation}deg)`,
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                🎈
              </div>
            ))}

            {/* 폭발 파티클 */}
            {explosions.map(explosion => 
              explosion.particles.map(particle => (
                <div
                  key={particle.id}
                  className="absolute rounded-full"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    backgroundColor: particle.color,
                    transform: 'translate(-50%, -50%)',
                    opacity: particle.life / particle.maxLife,
                    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                  }}
                /> 
              ))
            )}

            {/* 물줄기 (개선된 시각 효과). */}
            {waterDrops.map(drop => (
              <div
                key={drop.id}
                className="absolute rounded-full"
                style={{
                  left: `${drop.x}%`,
                  top: `${drop.y}%`,
                  width: `${drop.size}px`,
                  height: `${drop.size}px`,
                  backgroundColor: drop.streamIndex === 0 ? '#3b82f6' : '#60a5fa',
                  border: `1px solid ${drop.streamIndex === 0 ? '#1e40af' : '#3b82f6'}`,
                  transform: 'translate(-50%, -50%)',
                  opacity: drop.life / 100,
                  boxShadow: drop.streamIndex === 0 ? '0 0 8px rgba(59, 130, 246, 0.6)' : '0 0 4px rgba(96, 165, 250, 0.4)'
                }}
              />
            ))}

            {/* 플레이어 (개선된 시각 효과) */}
            <div
              className={`absolute bottom-4 w-14 h-14 rounded-full border-4 flex items-center justify-center text-2xl cursor-pointer select-none transition-all duration-200 ${
                canShoot 
                  ? 'bg-blue-800 border-blue-900 shadow-lg transform hover:scale-105' 
                  : 'bg-gray-600 border-gray-700 opacity-60'
              }`}
              style={{
                left: `${playerPosition}%`,
                transform: `translateX(-50%) ${canShoot ? '' : 'scale(0.9)'}`,
                boxShadow: canShoot ? '0 4px 15px rgba(30, 64, 175, 0.4)' : 'none'
              }}
              onTouchStart={handlePlayerMove}
              onTouchMove={handlePlayerMove}
              onMouseDown={handlePlayerMove}
              onMouseMove={(e) => e.buttons === 1 && handlePlayerMove(e)}
            >
              🔫
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">!! 게임 종료 !!</h1>
          <p className="text-3xl mb-4 font-bold text-yellow-300">최종 점수: {score}점</p>
          <p className="text-xl mb-8">
            {score >= 2000 ? '참, 대단하십니다아—.' : 
             score >= 1000 ? '그리 나쁘지 않네.' : 
             score >= 500 ? '그럭저럭—.' : '참으로 허접한 점수군요.'}
          </p>
          
          <div className="space-x-4">
            <button 
              onClick={startGame}
              className="bg-yellow-400 text-blue-800 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all duration-200 shadow-lg"
            >
              다시 하기
            </button>
            <button 
              onClick={() => setGameState('start')}
              className="bg-gray-400 text-gray-800 px-8 py-4 rounded-full text-xl font-bold hover:bg-gray-300 active:scale-95 transition-all duration-200 shadow-lg"
            >
              메인으로
            </button>
            <p className='absolute bottom-1 items-center justify-center'>※상단의 점수를 캡처해 비밀댓글로 올려주세요.※</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterGunGame;