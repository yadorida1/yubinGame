// 앱 진입점
window.addEventListener('DOMContentLoaded', () => {
  initCharacterSelect();

  document.getElementById('start-btn').addEventListener('click', () => {
    const nick = document.getElementById('nickname-input').value.trim();
    if (nick) CharConfig.nickname = nick;

    document.getElementById('character-select-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-screen').style.display = 'flex';
    document.getElementById('game-screen').style.flexDirection = 'column';

    G = createGame();
    G.start();
  });

  document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('gameover-screen').classList.add('hidden');
    G.restart();
  });

  document.getElementById('change-char-btn').addEventListener('click', () => {
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('character-select-screen').classList.add('active');
  });

  document.getElementById('play-again-btn').addEventListener('click', () => {
    document.getElementById('clear-screen').classList.add('hidden');
    G.restart();
  });

  // PC에서 모바일 컨트롤 숨기기 (터치 없으면)
  if (!('ontouchstart' in window)) {
    document.getElementById('mobile-controls').style.opacity = '0.4';
  }
});
