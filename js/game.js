// ── 게임 상수 ──
const CANVAS_W = 400;
const CANVAS_H = 600;
const GRAVITY  = 0.5;
const JUMP_F   = -12;
const MOVE_SPD = 3.5;
const TOTAL_FLOORS = 10;

// 체크포인트 색상 (로블럭스 스타일)
const CP_COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71',
  '#1abc9c','#3498db','#9b59b6','#e91e63',
  '#ff5722','#ffd700'
];

// ── 게임 상태 ──
let G = null; // 전역 게임 객체

function createGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');

  // 캔버스 크기를 화면에 맞게
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── 타워 레이아웃 생성 ──
  // 각 층 = { floor, y, platforms[], gate, checkpoint }
  const FLOOR_H = 160;  // 층당 높이 (월드 좌표)
  const towerHeight = TOTAL_FLOORS * FLOOR_H + 200;

  function buildTower() {
    const floors = [];
    for (let f = 1; f <= TOTAL_FLOORS; f++) {
      const baseY = towerHeight - f * FLOOR_H;
      floors.push(buildFloor(f, baseY));
    }
    // 바닥 (시작 지점)
    floors.unshift({ floor: 0, baseY: towerHeight - 20, platforms: [
      { x: 60, y: towerHeight, w: 280, h: 20, color: '#555' }
    ], gate: null, checkpoint: { x: 190, y: towerHeight - 20, color: '#aaa', reached: true } });
    return floors;
  }

  function buildFloor(f, baseY) {
    const cpColor = CP_COLORS[(f - 1) % CP_COLORS.length];
    // 플랫폼 배치 (층마다 패턴 다르게)
    const platforms = [];
    const pat = f % 4;
    if (pat === 0) {
      // 지그재그
      platforms.push({ x: 60,  y: baseY + 100, w: 100, h: 16, color: cpColor });
      platforms.push({ x: 240, y: baseY + 60,  w: 100, h: 16, color: cpColor });
    } else if (pat === 1) {
      // 가운데 하나
      platforms.push({ x: 130, y: baseY + 80, w: 140, h: 16, color: cpColor });
    } else if (pat === 2) {
      // 양쪽
      platforms.push({ x: 40,  y: baseY + 90, w: 90,  h: 16, color: cpColor });
      platforms.push({ x: 270, y: baseY + 70, w: 90,  h: 16, color: cpColor });
    } else {
      // 계단형
      platforms.push({ x: 50,  y: baseY + 110, w: 80, h: 16, color: cpColor });
      platforms.push({ x: 160, y: baseY + 75,  w: 80, h: 16, color: cpColor });
      platforms.push({ x: 270, y: baseY + 45,  w: 80, h: 16, color: cpColor });
    }

    // 관문 (층 위쪽에 작은 플랫폼 + 문)
    const gate = { x: 150, y: baseY + 10, w: 100, h: 14, color: cpColor, open: false, floor: f };

    // 체크포인트 (관문 바로 위)
    const checkpoint = { x: 190, y: baseY, color: cpColor, reached: false };

    return { floor: f, baseY, platforms, gate, checkpoint };
  }

  const floorData = buildTower();

  // ── 플레이어 ──
  function makePlayer() {
    return {
      x: 200, y: floorData[0].checkpoint.y - 40,
      vx: 0, vy: 0,
      w: 20, h: 40,
      onGround: false,
      dead: false,
      checkpointFloor: 0,
      currentFloor: 0,
    };
  }

  // ── 게임 변수 ──
  let player   = makePlayer();
  let hearts   = 3;
  let camera   = { y: 0 }; // 카메라 Y 오프셋 (월드 → 화면)
  let mathOpen = false;
  let pendingGate = null;
  let deathAnim = 0; // 죽음 애니메이션 타이머
  let winReached = false;

  // ── 입력 ──
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup',   e => keys[e.key] = false);

  // 모바일 버튼
  const btnL = document.getElementById('btn-left');
  const btnR = document.getElementById('btn-right');
  const btnJ = document.getElementById('btn-jump');
  ['touchstart','mousedown'].forEach(ev => {
    btnL.addEventListener(ev, e => { e.preventDefault(); keys['ArrowLeft'] = true; });
    btnR.addEventListener(ev, e => { e.preventDefault(); keys['ArrowRight'] = true; });
    btnJ.addEventListener(ev, e => { e.preventDefault(); keys[' '] = true; });
  });
  ['touchend','mouseup'].forEach(ev => {
    btnL.addEventListener(ev, e => { e.preventDefault(); keys['ArrowLeft'] = false; });
    btnR.addEventListener(ev, e => { e.preventDefault(); keys['ArrowRight'] = false; });
    btnJ.addEventListener(ev, e => { e.preventDefault(); keys[' '] = false; });
  });

  // ── 수학 팝업 ──
  function showMath(gate) {
    mathOpen = true;
    pendingGate = gate;
    player.vx = 0; player.vy = 0;

    const q = generateMathQuestion(gate.floor);
    document.getElementById('math-floor-label').textContent = `${gate.floor}층 관문`;
    document.getElementById('math-question').textContent = q.question;
    document.getElementById('math-feedback').textContent = '';

    const optDiv = document.getElementById('math-options');
    optDiv.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'math-opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => answerMath(opt, q.answer, gate));
      optDiv.appendChild(btn);
    });

    document.getElementById('math-popup').classList.remove('hidden');
  }

  function answerMath(chosen, correct, gate) {
    if (!mathOpen) return;
    const btns = document.querySelectorAll('.math-opt-btn');
    const fb   = document.getElementById('math-feedback');

    btns.forEach(b => {
      b.disabled = true;
      if (parseInt(b.textContent) === correct) b.classList.add('correct');
    });

    if (chosen === correct) {
      fb.textContent = '🎉 정답! 올라가세요!';
      fb.style.color = '#2ecc71';
      gate.open = true;
      setTimeout(() => {
        document.getElementById('math-popup').classList.add('hidden');
        mathOpen = false;
        pendingGate = null;
      }, 900);
    } else {
      btns.forEach(b => { if (parseInt(b.textContent) === chosen) b.classList.add('wrong'); });
      fb.textContent = '❌ 틀렸어요! 하트 -1';
      fb.style.color = '#e74c3c';
      hearts = Math.max(0, hearts - 1);
      updateHUD();
      setTimeout(() => {
        document.getElementById('math-popup').classList.add('hidden');
        mathOpen = false;
        if (hearts <= 0) {
          triggerGameOver();
        } else {
          respawn();
        }
      }, 1200);
    }
  }

  function respawn() {
    const cpFloor = floorData.find(f => f.floor === player.checkpointFloor);
    if (cpFloor) {
      player.x  = cpFloor.checkpoint.x;
      player.y  = cpFloor.checkpoint.y - 50;
      player.vx = 0;
      player.vy = 0;
      deathAnim = 60; // 1초 무적 깜빡임
    }
  }

  function triggerGameOver() {
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  // ── HUD 업데이트 ──
  function updateHUD() {
    document.getElementById('hearts-display').textContent =
      '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts);
    document.getElementById('floor-display').textContent =
      `${player.currentFloor}층`;
    document.getElementById('nickname-display').textContent =
      CharConfig.nickname;
  }

  // ── 물리 & 충돌 ──
  function update() {
    if (mathOpen || winReached) return;
    if (deathAnim > 0) deathAnim--;

    // 입력
    if (!player.dead) {
      if (keys['ArrowLeft']  || keys['a']) player.vx = -MOVE_SPD;
      else if (keys['ArrowRight'] || keys['d']) player.vx =  MOVE_SPD;
      else player.vx = 0;

      if ((keys[' '] || keys['ArrowUp'] || keys['w']) && player.onGround) {
        player.vy = JUMP_F;
        player.onGround = false;
      }
    }

    // 중력
    player.vy += GRAVITY;
    player.x  += player.vx;
    player.y  += player.vy;

    // 벽 (좌우)
    const wallL = 10, wallR = CANVAS_W - 10 - player.w;
    if (player.x < wallL) { player.x = wallL; player.vx = 0; }
    if (player.x > wallR) { player.x = wallR; player.vx = 0; }

    // 플랫폼 충돌
    player.onGround = false;
    const allPlats = [];
    floorData.forEach(fd => {
      fd.platforms.forEach(p => allPlats.push(p));
      if (fd.gate && !fd.gate.open) allPlats.push(fd.gate);
    });

    allPlats.forEach(p => {
      if (rectOverlap(player, p) && player.vy >= 0) {
        const prevBottom = (player.y - player.vy) + player.h;
        if (prevBottom <= p.y + 4) {
          player.y = p.y - player.h;
          player.vy = 0;
          player.onGround = true;

          // 관문 위에 올라섰을 때 수학 문제
          if (p === fd_gate(p) && !p.open && !mathOpen) {
            showMath(p);
          }
        }
      }
    });

    // 관문 위 올라섬 감지
    floorData.forEach(fd => {
      if (fd.gate && !fd.gate.open) {
        const g = fd.gate;
        const px = player.x, py = player.y, pw = player.w, ph = player.h;
        const prevBottom = (py - player.vy) + ph;
        if (
          px + pw > g.x && px < g.x + g.w &&
          py + ph >= g.y && py + ph <= g.y + g.h + 4 &&
          prevBottom <= g.y + 4 &&
          player.vy >= 0 && !mathOpen
        ) {
          showMath(g);
        }
      }
    });

    // 추락 (바닥 아래로 떨어지면 마지막 체크포인트로)
    if (player.y > towerHeight + 200) {
      hearts = Math.max(0, hearts - 1);
      updateHUD();
      if (hearts <= 0) triggerGameOver();
      else respawn();
      return;
    }

    // 체크포인트 도달
    floorData.forEach(fd => {
      if (!fd.checkpoint.reached && fd.gate && fd.gate.open) {
        const cp = fd.checkpoint;
        if (Math.abs(player.x - cp.x) < 50 && Math.abs(player.y - cp.y) < 60) {
          cp.reached = true;
          player.checkpointFloor = fd.floor;
          player.currentFloor    = fd.floor;
          updateHUD();
        }
      }
    });

    // 꼭대기 도달
    const top = floorData[floorData.length - 1];
    if (player.y < top.baseY - 100) {
      winReached = true;
      document.getElementById('clear-screen').classList.remove('hidden');
      document.getElementById('clear-msg').textContent =
        `${CharConfig.nickname}는 수포자가 아니에요! 🎉`;
    }

    // 카메라 (플레이어를 화면 중앙 약간 아래)
    const targetCamY = player.y - canvas.height * 0.55;
    camera.y += (targetCamY - camera.y) * 0.1;
  }

  // 관문인지 확인 (충돌 시)
  function fd_gate(p) {
    for (const fd of floorData) {
      if (fd.gate === p) return p;
    }
    return null;
  }

  function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ── 렌더링 ──
  function draw() {
    const W = canvas.width, H = canvas.height;
    // 화면 비율에 맞는 스케일 (기준: 400px 너비)
    const scale = W / CANVAS_W;
    const offsetX = 0;
    const offsetY = -camera.y * scale;

    ctx.clearRect(0, 0, W, H);

    // 배경 그라디언트 (하늘)
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0015');
    grad.addColorStop(1, '#1a1a4e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 별
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + 50) % CANVAS_W) * scale;
      const sy = ((i * 97  + 30) % (towerHeight * 0.9)) * scale + offsetY;
      if (sy > -5 && sy < H + 5) {
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // 타워 외벽
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(40*scale, 0 + offsetY, (CANVAS_W-80)*scale, towerHeight*scale);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 체크포인트
    floorData.forEach(fd => {
      if (!fd.checkpoint) return;
      const cp = fd.checkpoint;
      ctx.fillStyle = cp.reached ? cp.color : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 10, 0, Math.PI * 2);
      ctx.fill();
      // 체크포인트 깃발
      ctx.strokeStyle = cp.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y - 10);
      ctx.lineTo(cp.x, cp.y - 30);
      ctx.stroke();
      ctx.fillStyle = cp.color;
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y - 30);
      ctx.lineTo(cp.x + 14, cp.y - 24);
      ctx.lineTo(cp.x, cp.y - 18);
      ctx.closePath();
      ctx.fill();
    });

    // 플랫폼
    floorData.forEach(fd => {
      fd.platforms.forEach(p => {
        // 플랫폼 그림자
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(p.x + 3, p.y + 4, p.w, p.h);
        // 플랫폼 본체
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // 하이라이트
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(p.x, p.y, p.w, 4);
      });

      // 관문
      if (fd.gate) {
        const g = fd.gate;
        if (g.open) {
          // 열린 관문 (반투명 녹색)
          ctx.fillStyle = 'rgba(46,204,113,0.3)';
          ctx.fillRect(g.x, g.y, g.w, g.h);
          ctx.strokeStyle = '#2ecc71';
          ctx.lineWidth = 2;
          ctx.strokeRect(g.x, g.y, g.w, g.h);
        } else {
          // 닫힌 관문 (빨간 벽)
          ctx.fillStyle = g.color;
          ctx.fillRect(g.x, g.y, g.w, g.h);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(g.x, g.y, g.w, g.h);
          // 자물쇠 아이콘
          ctx.fillStyle = '#fff';
          ctx.font = `${g.h * 0.9}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('🔒', g.x + g.w/2, g.y + g.h * 0.9);
          ctx.textAlign = 'left';
          // 층 번호
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${10}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(`${g.floor}층`, g.x + g.w/2, g.y - 3);
          ctx.textAlign = 'left';
        }
      }
    });

    // 바닥
    ctx.fillStyle = '#333';
    ctx.fillRect(40, towerHeight, CANVAS_W - 80, 20);

    // 플레이어 (깜빡임 처리)
    const blink = deathAnim > 0 && Math.floor(deathAnim / 5) % 2 === 0;
    if (!blink) {
      drawCharacter(ctx, player.x + player.w/2, player.y + player.h - 3, 0.8, CharConfig);
    }

    ctx.restore();
  }

  // ── 게임 루프 ──
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // ── 공개 API ──
  return {
    start() {
      updateHUD();
      loop();
    },
    restart() {
      player   = makePlayer();
      hearts   = 3;
      camera.y = 0;
      mathOpen = false;
      winReached = false;
      floorData.forEach(fd => {
        if (fd.gate) fd.gate.open = false;
        if (fd.checkpoint) fd.checkpoint.reached = fd.floor === 0;
      });
      updateHUD();
    }
  };
}
