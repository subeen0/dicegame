import React, { useState, useEffect } from 'react';
import * as XLSX from 'sheetjs-style';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDh8jbTHvEMMhTyzG07S4edoCTV3SOngv0",
  authDomain: "dice-f2e91.firebaseapp.com",
  projectId: "dice-f2e91",
  storageBucket: "dice-f2e91.firebasestorage.app",
  messagingSenderId: "183613015939",
  appId: "1:183613015939:web:16fd274c05dd6d2e7558b6",
  measurementId: "G-PZ904DKCDB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

const DiceBettingGame = () => {
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [oddEven, setOddEven] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [gameResult, setGameResult] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [activeTab, setActiveTab] = useState('game');
  const [firebaseStatus, setFirebaseStatus] = useState('연결됨');
  const [loading, setLoading] = useState(false);

  // Firebase에서 로그 불러오기
  const loadFromFirebase = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'gameLogs'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          time: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString('ko-KR') : data.time
        });
      });
      setGameLog(logs);
      setFirebaseStatus('연결됨 - 로그 로드 완료');
    } catch (error) {
      console.error('Firebase 로드 오류:', error);
      setFirebaseStatus('연결 오류');
      alert('Firebase에서 로그를 불러오는데 실패했습니다.');
    }
    setLoading(false);
  };

  // Firebase에 로그 저장
  const saveToFirebase = async (logEntry) => {
    try {
      await addDoc(collection(db, 'gameLogs'), {
        ...logEntry,
        timestamp: new Date()
      });
      setFirebaseStatus('연결됨 - 저장 완료');
    } catch (error) {
      console.error('Firebase 저장 오류:', error);
      setFirebaseStatus('저장 오류');
    }
  };

  // Firebase에서 모든 로그 삭제
  const clearFirebaseLogs = async () => {
    if (!window.confirm('Firebase의 모든 로그를 삭제하시겠습니까?')) {
      return;
    }
    
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'gameLogs'));
      const deletePromises = [];
      querySnapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, 'gameLogs', document.id)));
      });
      await Promise.all(deletePromises);
      setGameLog([]);
      setFirebaseStatus('연결됨 - 삭제 완료');
      alert('모든 로그가 삭제되었습니다.');
    } catch (error) {
      console.error('Firebase 삭제 오류:', error);
      setFirebaseStatus('삭제 오류');
      alert('로그 삭제에 실패했습니다.');
    }
    setLoading(false);
  };

  // 컴포넌트 마운트 시 Firebase에서 로그 불러오기
  useEffect(() => {
    loadFromFirebase();
  }, []);

  const selectNumber = (num) => {
    setSelectedNumber(num);
  };

  const playGame = async () => {
    if (!selectedNumber) {
      alert('숫자를 선택해주세요!');
      return;
    }
    
    if (!oddEven) {
      alert('홀/짝을 선택해주세요!');
      return;
    }
    
    const betAmountNum = parseInt(betAmount);
    if (!betAmountNum || betAmountNum <= 0) {
      alert('올바른 배팅 금액을 입력해주세요!');
      return;
    }
    
    // 랜덤 숫자 생성 (1-6)
    const resultNumber = Math.floor(Math.random() * 6) + 1;
    const resultOddEven = resultNumber % 2 === 0 ? '짝' : '홀';
    
    // 결과 계산
    let profit = 0;
    let resultText = '';
    
    const numberMatch = selectedNumber === resultNumber;
    const oddEvenMatch = oddEven === resultOddEven;
    
    if (numberMatch && oddEvenMatch) {
      profit = betAmountNum * 2; // 둘 다 맞으면 2배
      resultText = '🎉 대박! 숫자와 홀/짝 모두 맞췄습니다!';
    } else if (oddEvenMatch) {
      profit = betAmountNum * 0.5; // 홀/짝만 맞으면 1.5배 (0.5배 이익)
      resultText = '👍 홀/짝을 맞췄습니다!';
    } else {
      profit = -betAmountNum; // 틀리면 손실
      resultText = '😢 아쉽네요. 다시 도전해보세요!';
    }
    
    // 결과 설정
    setGameResult({
      resultText,
      resultNumber,
      resultOddEven,
      profit,
      predictedNumber: selectedNumber,
      predictedOddEven: oddEven
    });
    
    // 로그 엔트리 생성
    const now = new Date();
    const logEntry = {
      time: now.toLocaleString('ko-KR'),
      predictedNumber: selectedNumber,
      predictedOddEven: oddEven,
      betAmount: betAmountNum,
      resultNumber: resultNumber,
      resultOddEven: resultOddEven,
      profit: profit,
      result: profit >= 0 ? '승리' : '패배'
    };
    
    // 로컬 상태 업데이트
    setGameLog(prev => [logEntry, ...prev]);
    
    // Firebase에 저장
    await saveToFirebase(logEntry);
    
    // 입력 초기화
    setSelectedNumber(null);
    setOddEven('');
    setBetAmount('');
  };

  const downloadExcel = () => {
    if (gameLog.length === 0) {
      alert('다운로드할 게임 로그가 없습니다!');
      return;
    }
    
    // 게임 시트 데이터
    const gameSheet = [
      ['주사위 베팅 게임'],
      [],
      ['예상 숫자', '예상 홀/짝', '배팅 금액'],
      ['1-6 중 선택', '홀/짝 중 선택', '금액 입력'],
      [],
      ['게임 방법:'],
      ['1. 1-6 중 숫자 선택'],
      ['2. 홀/짝 선택'],
      ['3. 배팅 금액 입력'],
      ['4. 게임 시작'],
      [],
      ['배당률:'],
      ['숫자 + 홀/짝 둘 다 맞춤: 2배'],
      ['홀/짝만 맞춤: 1.5배'],
      ['둘 다 틀림: 손실']
    ];
    
    // 로그 시트 데이터
    const logSheet = [
      ['시간', '예상 숫자', '예상 홀/짝', '배팅 금액', '결과 숫자', '결과 홀/짝', '수익/손실', '결과']
    ];
    
    gameLog.forEach(entry => {
      logSheet.push([
        entry.time,
        entry.predictedNumber,
        entry.predictedOddEven,
        entry.betAmount,
        entry.resultNumber,
        entry.resultOddEven,
        entry.profit,
        entry.result
      ]);
    });
    
    // 통계 추가
    const totalGames = gameLog.length;
    const totalProfit = gameLog.reduce((sum, entry) => sum + entry.profit, 0);
    const wins = gameLog.filter(entry => entry.profit >= 0).length;
    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
    
    logSheet.push([]);
    logSheet.push(['통계']);
    logSheet.push(['총 게임 수', totalGames]);
    logSheet.push(['총 수익', totalProfit]);
    logSheet.push(['승률', winRate + '%']);
    
    // Excel 파일 생성
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(gameSheet);
    const ws2 = XLSX.utils.aoa_to_sheet(logSheet);
    
    XLSX.utils.book_append_sheet(wb, ws1, "게임");
    XLSX.utils.book_append_sheet(wb, ws2, "로그");
    
    // 파일 다운로드
    const now = new Date();
    const filename = `주사위_베팅_게임_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // 통계 계산
  const totalGames = gameLog.length;
  const totalProfit = gameLog.reduce((sum, entry) => sum + entry.profit, 0);
  const wins = gameLog.filter(entry => entry.profit >= 0).length;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white text-center py-8">
          <h1 className="text-4xl font-bold mb-2 text-shadow">🎲 주사위 베팅 게임</h1>
          <p className="text-lg opacity-90">숫자와 홀/짝을 예측해보세요!</p>
          <div className={`mt-3 inline-block px-4 py-2 rounded-full text-sm font-medium ${
            firebaseStatus.includes('연결됨') 
              ? 'bg-green-500 bg-opacity-20 text-green-100' 
              : 'bg-red-500 bg-opacity-20 text-red-100'
          }`}>
            🔥 Firebase: {firebaseStatus}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100">
          <button
            className={`flex-1 py-4 text-center font-medium transition-all ${
              activeTab === 'game' 
                ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('game')}
          >
            게임
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium transition-all ${
              activeTab === 'log' 
                ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('log')}
          >
            게임 로그
          </button>
        </div>

        {/* Game Tab */}
        {activeTab === 'game' && (
          <div className="p-8">
            {/* Number Selection */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
              <label className="block mb-4 text-lg font-bold text-gray-700">
                예상 숫자 선택 (1-6):
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    className={`py-4 px-6 text-xl font-bold rounded-lg border-2 transition-all ${
                      selectedNumber === num
                        ? 'bg-blue-500 text-white border-blue-500 transform scale-105'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => selectNumber(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Odd/Even Selection */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
              <label className="block mb-4 text-lg font-bold text-gray-700">
                홀/짝 선택:
              </label>
              <select
                value={oddEven}
                onChange={(e) => setOddEven(e.target.value)}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">선택하세요</option>
                <option value="홀">홀수</option>
                <option value="짝">짝수</option>
              </select>
            </div>

            {/* Bet Amount */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
              <label className="block mb-4 text-lg font-bold text-gray-700">
                배팅 금액:
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="1"
                placeholder="배팅할 금액을 입력하세요"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Play Button */}
            <button
              onClick={playGame}
              disabled={loading}
              className={`w-full py-5 text-white text-xl font-bold rounded-xl transition-all shadow-lg ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:transform hover:-translate-y-1'
              }`}
            >
              {loading ? '처리 중...' : '🎲 게임 시작!'}
            </button>

            {/* Game Result */}
            {gameResult && (
              <div className={`mt-6 p-6 rounded-xl text-center text-lg font-bold ${
                gameResult.profit >= 0 
                  ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                  : 'bg-red-100 text-red-800 border-2 border-red-300'
              }`}>
                <h3 className="text-xl mb-3">{gameResult.resultText}</h3>
                <p className="mb-2">
                  <strong>결과:</strong> {gameResult.resultNumber} ({gameResult.resultOddEven})
                </p>
                <p className="mb-2">
                  <strong>예상:</strong> {gameResult.predictedNumber} ({gameResult.predictedOddEven})
                </p>
                <p>
                  <strong>수익/손실:</strong> {gameResult.profit > 0 ? '+' : ''}{gameResult.profit}원
                </p>
              </div>
            )}
          </div>
        )}

        {/* Log Tab */}
        {activeTab === 'log' && (
          <div className="p-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-100 p-6 text-center rounded-xl border-2 border-gray-200">
                <div className="text-3xl font-bold text-gray-700">{totalGames}</div>
                <div className="text-sm text-gray-600 mt-1">총 게임 수</div>
              </div>
              <div className="bg-gray-100 p-6 text-center rounded-xl border-2 border-gray-200">
                <div className="text-3xl font-bold text-gray-700">{totalProfit}</div>
                <div className="text-sm text-gray-600 mt-1">총 수익</div>
              </div>
              <div className="bg-gray-100 p-6 text-center rounded-xl border-2 border-gray-200">
                <div className="text-3xl font-bold text-gray-700">{winRate}%</div>
                <div className="text-sm text-gray-600 mt-1">승률</div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
              <button
                onClick={loadFromFirebase}
                disabled={loading}
                className={`px-6 py-3 text-white rounded-lg transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loading ? '로딩 중...' : '🔄 Firebase에서 새로고침'}
              </button>
              <button
                onClick={clearFirebaseLogs}
                disabled={loading}
                className={`px-6 py-3 text-white rounded-lg transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                🗑️ Firebase 로그 삭제
              </button>
              <button
                onClick={downloadExcel}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                📊 Excel 파일 다운로드
              </button>
            </div>

            {/* Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-sm">시간</th>
                    <th className="border border-gray-300 p-3 text-sm">예상 숫자</th>
                    <th className="border border-gray-300 p-3 text-sm">예상 홀/짝</th>
                    <th className="border border-gray-300 p-3 text-sm">배팅 금액</th>
                    <th className="border border-gray-300 p-3 text-sm">결과 숫자</th>
                    <th className="border border-gray-300 p-3 text-sm">결과 홀/짝</th>
                    <th className="border border-gray-300 p-3 text-sm">수익/손실</th>
                    <th className="border border-gray-300 p-3 text-sm">결과</th>
                  </tr>
                </thead>
                <tbody>
                  {gameLog.map((entry, index) => (
                    <tr key={entry.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-3 text-sm">{entry.time}</td>
                      <td className="border border-gray-300 p-3 text-sm text-center">{entry.predictedNumber}</td>
                      <td className="border border-gray-300 p-3 text-sm text-center">{entry.predictedOddEven}</td>
                      <td className="border border-gray-300 p-3 text-sm text-center">{entry.betAmount}</td>
                      <td className="border border-gray-300 p-3 text-sm text-center">{entry.resultNumber}</td>
                      <td className="border border-gray-300 p-3 text-sm text-center">{entry.resultOddEven}</td>
                      <td className={`border border-gray-300 p-3 text-sm text-center ${
                        entry.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.profit > 0 ? '+' : ''}{entry.profit}
                      </td>
                      <td className="border border-gray-300 p-3 text-sm text-center">{entry.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gameLog.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {loading ? '로딩 중...' : '아직 게임 로그가 없습니다. 게임을 시작해보세요!'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceBettingGame;