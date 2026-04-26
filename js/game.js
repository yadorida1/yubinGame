// ── 게임 상수 ──
const CANVAS_W = 400;   // 월드 좌표계 너비 (기준)
const GRAVITY  = 0.55;
const JUMP_F   = -13;
const MOVE_SPD = 3.5;
const TOTAL_FLOORS = 10;
const FLOOR_H  = 180;   // 층당 월드 높이

const CP_COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71',
  '#1abc9c','#3498db','#9b59b6','#e91e63',
  '#ff5722','#ffd700'
];

let G = null;

function createGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); snapCamera(); });

  // ── 월드 크기 ──
  const towerH = TOTAL_FLOORS * FLOOR_H + 300; // 전체 타워 높이

  // ── 타워 레이아웃 ──
  function buildFloor(f, baseY) {
    const col = CP_COLORS[(f - 1) % CP_COLORS.length];
    const platforms = [];
    const pat = f % 4;

    if (pat === 1) {
      platforms.push({ x: 120, y: baseY + 100, w: 160, h: 18, color: col });
    } else if (pat === 2) {
      platforms.push({ x: 50,  y: baseY + 110, w: 110, h: 18, color: col });
      platforms.push({ x: 240, y: baseY + 80,  w: 110, h: 18, color: col });
    } else if (pat === 3) {
      platforms.push({ x: 50,  y: baseY + 130, w: 90,  h: 18, color: col });
      platforms.push({ x: 165, y: baseY + 95,  w: 90,  h: 18, color: col });
      platforms.push({ x: 260, y: baseY + 60,  w: 90,  h: 18, color: col });
    } else {
      platforms.push({ x: 60,  y: baseY + 120, w: 120, h: 18, color: col });
      platforms.push({ x: 220, y: baseY + 75,  w: 120, h: 18, color: col });
    }

    // 관문: 플랫폼들보다 위쪽, 체크포인트 바로 아래
    const gate = {
      x: 140, y: baseY + 20, w: 120, h: 18,
      color: col, open: false, floor: f, isGate: true
    };
    // 체크포인트 (관문 통과 후 표시)
    const checkpoint = { x: 200, y: baseY + 5, color: col, reached: false };

    return { floor: f, baseY, platforms, gate, checkpoint };
  }

  function buildTower() {
    const floors = [];
    // 0층: 시작 바닥
    const floorY = towerH;
    floors.push({
      floor: 0, baseY: floorY,
      platforms: [{ x: 60, y: floorY, w: 280, h: 24, color: '#666' }],
      gate: null,
      checkpoint: { x: 200, y: floorY - 10, color: '#aaa', reached: true }
    });
    for (let f = 1; f <= TOTAL_FLOORS; f++) {
      floors.push(buildFloor(f, towerH - f * FLOOR_H));
    }
    return floors;
  }

  const floorData = buildTower();

  // ── 플레이어 ──
  function makePlayer() {
    const startFloor = floorData[0];
    return {
      x: 190,
      y: startFloor.platforms[0].y - 44,  // 바닥 위에 정확히 올려놓기
      vx: 0, vy: 0,
      w: 22, h: 42,
      onGround: false,
      checkpointFloor: 0,
      currentFloor: 0,
    };
  }

  // ── 상태 변수 ──
  let player    = makePlayer();
  let hearts    = 3;
  let camera    = { y: 0 };
  let mathOpen  = false;
  let deathAnim = 0;
  let winReached= false;

  // 카메라를 플레이어 위치로 즉시 맞추기
  function snapCamera() {
    const scale = canvas.width / CANVAS_W;
    camera.y = player.y - (canvas.height * 0.55) / scale;
  }

  // ── 입력 ──
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const btnL = document.getElementById('btn-left');
  const btnR = document.getElementById('btn-right');
  const btnJ = document.getElementById('btn-jump');

  function setKey(k, v) { keys[k] = v; }
  ['touchstart','mousedown'].forEach(ev => {
    btnL.addEventListener(ev, e => { e.preventDefault(); setKey('ArrowLeft',  true); });
    btnR.addEventListener(ev, e => { e.preventDefault(); setKey('ArrowRight', true); });
    btnJ.addEventListener(ev, e => { e.preventDefault(); setKey(' ', true); });
  });
  ['touchend','touchcancel','mouseup'].forEach(ev => {
    btnL.addEventListener(ev, e => { e.preventDefault(); setKey('ArrowLeft',  false); });
    btnR.addEventListener(ev, e => { e.preventDefault(); setKey('ArrowRight', false); });
    btnJ.addEventListener(ev, e => { e.preventDefault(); setKey(' ', false); });
  });

  // ── 수학 팝업 ──
  function showMath(gate) {
    if (mathOpen) return;
    mathOpen = true;
    player.vx = 0; player.vy = 0;

    const q = generateMathQuestion(gate.floor);
    document.getElementById('math-floor-label').textContent = `${gate.floor}층 관문`;
    document.getElementById('math-question').textContent = q.question;
    document.getElementById('math-feedback').textContent = '';
    document.getElementById('math-feedback').style.color = '#fff';

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
    document.querySelectorAll('.math-opt-btn').forEach(b => {
      b.disabled = true;
      if (Number(b.textContent) === correct) b.classList.add('correct');
      if (Number(b.textContent) === chosen && chosen !== correct) b.classList.add('wrong');
    });

    const fb = document.getElementById('math-feedback');
    if (chosen === correct) {
      fb.textContent = '🎉 정답! 올라가세요!';
      fb.style.color = '#2ecc71';
      gate.open = true;
      setTimeout(closeMathPopup, 900);
    } else {
      fb.textContent = '❌ 틀렸어요! 하트 -1';
      fb.style.color = '#e74c3c';
      hearts = Math.max(0, hearts - 1);
      updateHUD();
      setTimeout(() => {
        closeMathPopup();
        if (hearts <= 0) triggerGameOver();
        else respawn();
      }, 1200);
    }
  }

  function closeMathPopup() {
    document.getElementById('math-popup').classList.add('hidden');
    mathOpen = false;
  }

  function respawn() {
    const fd = floorData.find(f => f.floor === player.checkpointFloor);
    if (!fd) return;
    const cp = fd.checkpoint;
    // 체크포인트 깃발 아래 플랫폼이나 바닥 위에 스폰
    const spawnPlatY = fd.floor === 0
      ? fd.platforms[0].y
      : fd.gate ? fd.gate.y
      : fd.baseY + 50;
    player.x  = cp.x - player.w / 2;
    player.y  = spawnPlatY - player.h - 2;
    player.vx = 0;
    player.vy = 0;
    deathAnim = 90;
    snapCamera();
  }

  function triggerGameOver() {
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  // ── HUD ──
  function updateHUD() {
    document.getElementById('hearts-display').textContent =
      '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts);
    document.getElementById('floor-display').textContent =
      player.currentFloor + '층';
    document.getElementById('nickname-display').textContent =
      CharConfig.nickname;
  }

  // ── 물리 & 충돌 ──
  function getAllPlatforms() {
    const list = [];
    floorData.forEach(fd => {
      fd.platforms.forEach(p => list.push({ plat: p, gate: null }));
      if (fd.gate && !fd.gate.open) list.push({ plat: fd.gate, gate: fd.gate });
    });
    return list;
  }

  function update() {
    if (mathOpen || winReached) return;
    if (deathAnim > 0) deathAnim--;

    // 입력 처리
    if (keys['ArrowLeft']  || keys['a']) player.vx = -MOVE_SPD;
    else if (keys['ArrowRight'] || keys['d']) player.vx =  MOVE_SPD;
    else player.vx *= 0.7; // 부드러운 멈춤

    const jumpKey = keys[' '] || keys['ArrowUp'] || keys['w'];
    if (jumpKey && player.onGround) {
      player.vy = JUMP_F;
      player.onGround = false;
    }

    // 중력
    player.vy = Math.min(player.vy + GRAVITY, 18); // 최대 낙하속도 제한
    player.x += player.vx;
    player.y += player.vy;

    // 좌우 벽
    const wL = 55, wR = CANVAS_W - 55 - player.w;
    if (player.x < wL) { player.x = wL; player.vx = 0; }
    if (player.x > wR) { player.x = wR; player.vx = 0; }

    // 플랫폼 충돌 (위에서 착지만)
    player.onGround = false;
    const plats = getAllPlatforms();
    for (const { plat: p, gate } of plats) {
      // 플레이어 이전 프레임 바닥 위치
      const prevBottom = player.y - player.vy + player.h;
      const curBottom  = player.y + player.h;

      const hOverlap = player.x + player.w > p.x && player.x < p.x + p.w;
      const landedOn = hOverlap && curBottom >= p.y && prevBottom <= p.y + p.h * 0.5 && player.vy >= 0;

      if (landedOn) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;

        // 관문 위에 착지 → 수학 문제
        if (gate && !gate.open) {
          showMath(gate);
        }
        break;
      }
    }

    // 추락 처리
    if (player.y > towerH + 300) {
      hearts = Math.max(0, hearts - 1);
      updateHUD();
      if (hearts <= 0) triggerGameOver();
      else respawn();
      return;
    }

    // 체크포인트 등록
    floorData.forEach(fd => {
      if (fd.floor === 0 || !fd.gate || !fd.gate.open || fd.checkpoint.reached) return;
      const cp = fd.checkpoint;
      if (Math.abs((player.x + player.w/2) - cp.x) < 60 && Math.abs(player.y - cp.y) < 80) {
        cp.reached = true;
        player.checkpointFloor = fd.floor;
        player.currentFloor    = fd.floor;
        updateHUD();
      }
    });

    // 꼭대기 도달
    const topFloor = floorData[floorData.length - 1];
    if (player.y < topFloor.baseY - 80) {
      winReached = true;
      document.getElementById('clear-screen').classList.remove('hidden');
      document.getElementById('clear-msg').textContent =
        CharConfig.nickname + '는 수포자가 아니에요! 🎉';
    }

    // 카메라 (스케일 보정)
    const scale = canvas.width / CANVAS_W;
    const targetCamY = player.y - (canvas.height * 0.50) / scale;
    camera.y += (targetCamY - camera.y) * 0.12;
  }

  // ── 렌더링 ──
  function draw() {
    const W = canvas.width, H = canvas.height;
    const scale = W / CANVAS_W;
    // 월드 → 화면: screen_y = (world_y - camera.y) * scale
    const oy = -camera.y * scale;

    ctx.clearRect(0, 0, W, H);

    // 배경
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050010');
    bg.addColorStop(1, '#0d1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 별 (화면 고정)
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 70; i++) {
      const sx = (i * 173 % W);
      const sy = (i * 113 % H);
      ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }

    // 월드 변환 시작
    ctx.save();
    ctx.translate(0, oy);
    ctx.scale(scale, scale);

    // 타워 외벽
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(55, 0, CANVAS_W - 110, towerH + 30);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(55, 0, CANVAS_W - 110, towerH + 30);

    // 체크포인트 깃발
    floorData.forEach(fd => {
      const cp = fd.checkpoint;
      const flagX = cp.x;
      const flagY = cp.y;
      const reached = cp.reached;

      // 깃대
      ctx.strokeStyle = reached ? cp.color : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(flagX, flagY);
      ctx.lineTo(flagX, flagY - 34);
      ctx.stroke();

      // 깃발 삼각형
      ctx.fillStyle = reached ? cp.color : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(flagX, flagY - 34);
      ctx.lineTo(flagX + 18, flagY - 26);
      ctx.lineTo(flagX, flagY - 18);
      ctx.closePath();
      ctx.fill();

      // 바닥 원
      ctx.beginPath();
      ctx.arc(flagX, flagY, 5, 0, Math.PI * 2);
      ctx.fillStyle = reached ? cp.color : 'rgba(255,255,255,0.2)';
      ctx.fill();

      // "CP" 텍스트
      if (reached) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', flagX + 8, flagY - 24);
        ctx.textAlign = 'left';
      }
    });

    // 플랫폼
    floorData.forEach(fd => {
      fd.platforms.forEach(p => {
        // 그림자
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(p.x + 4, p.y + 5, p.w, p.h);
        // 본체
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // 상단 하이라이트
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 4);
      });

      // 관문
      if (fd.gate) {
        const g = fd.gate;
        if (g.open) {
          ctx.fillStyle = 'rgba(46,204,113,0.2)';
          ctx.fillRect(g.x, g.y, g.w, g.h);
          ctx.strokeStyle = '#2ecc71';
          ctx.lineWidth = 2;
          ctx.strokeRect(g.x, g.y, g.w, g.h);
        } else {
          // 닫힌 관문
          ctx.fillStyle = g.color;
          ctx.fillRect(g.x, g.y, g.w, g.h);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(g.x, g.y, g.w, g.h);
          // 하이라이트
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(g.x + 2, g.y + 2, g.w - 4, 3);
          // 자물쇠
          ctx.font = `${Math.round(g.h)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          ctx.fillText('🔒', g.x + g.w / 2, g.y + g.h - 1);
          // 층 번호
          ctx.font = 'bold 9px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText(g.floor + '층 관문', g.x + g.w / 2, g.y - 4);
          ctx.textAlign = 'left';
        }
      }
    });

    // 시작 바닥
    ctx.fillStyle = '#555';
    ctx.fillRect(55, towerH + 24, CANVAS_W - 110, 8);

    // 플레이어 (발 기준 Y: player.y + player.h, 캐릭터 그리기 pivot은 허리이므로 41px 위로)
    const blink = deathAnim > 0 && Math.floor(deathAnim / 6) % 2 === 0;
    if (!blink) {
      drawCharacter(ctx, player.x + player.w / 2, player.y + player.h - 41, 1.0, CharConfig);
    }

    ctx.restore();

    // 디버그: 플레이어 위치 (개발 중 확인용)
    // ctx.fillStyle='yellow'; ctx.font='12px Arial';
    // ctx.fillText(`P: ${Math.round(player.x)},${Math.round(player.y)} cam:${Math.round(camera.y)}`, 8, 16);
  }

  // ── 게임 루프 ──
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  return {
    start() {
      snapCamera();
      updateHUD();
      loop();
    },
    restart() {
      player    = makePlayer();
      hearts    = 3;
      mathOpen  = false;
      winReached= false;
      deathAnim = 0;
      floorData.forEach(fd => {
        if (fd.gate) fd.gate.open = false;
        if (fd.checkpoint) fd.checkpoint.reached = (fd.floor === 0);
      });
      snapCamera();
      updateHUD();
    }
  };
}
