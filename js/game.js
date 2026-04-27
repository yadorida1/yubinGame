// ── 3D 게임 상수 ──
const TOWER_W    = 7.0;   // 타워 너비 (x: -3.5 ~ +3.5)
const FLOOR_H_3D = 4.5;   // 층당 높이
const TOTAL_FLOORS = 10;
const PLAT_THICK = 0.28;  // 플랫폼 두께
const PLAT_DEPTH = 2.0;   // 플랫폼 Z 깊이
const TOWER_H    = TOTAL_FLOORS * FLOOR_H_3D + 3;

// 물리
const GRAV    = 0.014;
const JUMP_V  = 0.30;
const MOVE_V  = 0.10;
const MAX_VY  = -0.60;

// 체크포인트 색상
const CP_COLORS_3D = [
  0xe74c3c, 0xe67e22, 0xf1c40f, 0x2ecc71,
  0x1abc9c, 0x3498db, 0x9b59b6, 0xe91e63,
  0xff5722, 0xffd700
];

let G = null;

function createGame() {
  const canvas = document.getElementById('game-canvas');

  // ── Three.js 기본 설정 ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04001a);
  scene.fog = new THREE.FogExp2(0x04001a, 0.022);

  const cam = new THREE.PerspectiveCamera(58, 1, 0.1, 150);

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  onResize();
  window.addEventListener('resize', onResize);

  // ── 조명 ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.40));

  const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
  sun.position.set(5, 14, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
  sun.shadow.camera.top  =  12; sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 1;   sun.shadow.camera.far   = 60;
  scene.add(sun);

  // 파란 보조광
  const fill = new THREE.DirectionalLight(0x3366ff, 0.28);
  fill.position.set(-5, 3, -5);
  scene.add(fill);

  // ── 별 파티클 ──
  const starVerts = [];
  for (let i = 0; i < 900; i++) {
    starVerts.push(
      (Math.random() - 0.5) * 120,
      Math.random() * 90 - 5,
      -10 - Math.random() * 60
    );
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09 })));

  // ── 타워 외벽 ──
  const wallMat = new THREE.MeshLambertMaterial({
    color: 0x0a0033, transparent: true, opacity: 0.3, side: THREE.BackSide
  });
  const wallMesh = new THREE.Mesh(
    new THREE.BoxGeometry(TOWER_W + 0.6, TOWER_H + 2, PLAT_DEPTH + 0.6),
    wallMat
  );
  wallMesh.position.set(0, TOWER_H / 2, 0);
  scene.add(wallMesh);

  // ── 헬퍼: 플랫폼 메시 생성 ──
  function makePlat(cx, topY, width, color) {
    const geo = new THREE.BoxGeometry(width, PLAT_THICK, PLAT_DEPTH);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, topY - PLAT_THICK / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return { cx, topY, halfW: width / 2, mesh };
  }

  // ── 관문 생성 ──
  function makeGate(baseY, color, f) {
    const gw = 4.5, gh = 0.30;
    const topY = baseY + 0.75;

    const geo = new THREE.BoxGeometry(gw, gh, PLAT_DEPTH);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, topY - gh / 2, 0);
    mesh.castShadow = true;
    scene.add(mesh);

    // 자물쇠 (노란 박스)
    const lockGeo = new THREE.BoxGeometry(0.28, 0.28, 0.12);
    const lockMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const lock = new THREE.Mesh(lockGeo, lockMat);
    lock.position.set(0, topY + 0.22, PLAT_DEPTH / 2 + 0.06);
    scene.add(lock);

    // 층 번호 표시 작은 박스들
    const numBoxes = [];
    for (let digit = 0; digit < 2; digit++) {
      const nb = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.06),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      nb.position.set(-0.08 + digit * 0.18, topY + 0.22, PLAT_DEPTH / 2 + 0.06);
      scene.add(nb);
      numBoxes.push(nb);
    }

    return {
      cx: 0, topY, halfW: gw / 2,
      mesh, lock, mat, origColor: color,
      open: false, floor: f, isGate: true
    };
  }

  // ── 체크포인트 깃발 생성 ──
  function makeCheckpoint(cx, y, color) {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), poleMat
    );
    pole.position.set(cx, y + 0.7, 0);
    scene.add(pole);

    const flagMat = new THREE.MeshLambertMaterial({
      color, transparent: true, opacity: 0.35
    });
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.30, 0.05), flagMat);
    flag.position.set(cx + 0.275, y + 1.25, 0);
    scene.add(flag);

    // 바닥 디스크
    const diskMat = new THREE.MeshLambertMaterial({ color });
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14), diskMat);
    disk.position.set(cx, y + 0.02, 0);
    scene.add(disk);

    return { cx, y, color, reached: false, flagMat, pole, flag, disk };
  }

  // ── 층 레이아웃 구성 ──
  function buildFloor3D(f, baseY) {
    const col = CP_COLORS_3D[(f - 1) % CP_COLORS_3D.length];
    const plats = [];
    const pat = f % 4;

    if (pat === 1) {
      plats.push(makePlat(0,    baseY + 2.9, 3.8, col));
    } else if (pat === 2) {
      plats.push(makePlat(-1.4, baseY + 3.1, 2.5, col));
      plats.push(makePlat( 1.4, baseY + 2.2, 2.5, col));
    } else if (pat === 3) {
      plats.push(makePlat(-2.1, baseY + 3.4, 2.2, col));
      plats.push(makePlat( 0.0, baseY + 2.6, 2.2, col));
      plats.push(makePlat( 2.1, baseY + 1.8, 2.2, col));
    } else {
      plats.push(makePlat(-1.3, baseY + 3.1, 3.0, col));
      plats.push(makePlat( 1.5, baseY + 2.1, 2.4, col));
    }

    const gate = makeGate(baseY, col, f);
    const cp   = makeCheckpoint(-3.0, baseY + 0.15, col);

    return { floor: f, baseY, platforms: plats, gate, checkpoint: cp };
  }

  // ── 전체 타워 구성 ──
  // 바닥
  const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(TOWER_W, 0.55, PLAT_DEPTH + 1.2),
    new THREE.MeshLambertMaterial({ color: 0x555555 })
  );
  floorMesh.position.set(0, -0.275, 0);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const floorData = [
    {
      floor: 0, baseY: 0,
      platforms: [{ cx: 0, topY: 0, halfW: TOWER_W / 2, mesh: floorMesh }],
      gate: null,
      checkpoint: { cx: -2.5, y: 0.05, color: 0xaaaaaa, reached: true, flagMat: null }
    }
  ];
  for (let f = 1; f <= TOTAL_FLOORS; f++) {
    floorData.push(buildFloor3D(f, f * FLOOR_H_3D));
  }

  // ── 플레이어 ──
  let charMesh = createCharacter3D(CharConfig);
  charMesh.scale.setScalar(0.55);
  scene.add(charMesh);

  function makePlayer() {
    return {
      x: 0, y: 0.05,
      vx: 0, vy: 0,
      onGround: false,
      checkpointFloor: 0,
      currentFloor: 0,
      walkAngle: 0,
    };
  }

  let player    = makePlayer();
  let hearts    = 3;
  let mathOpen  = false;
  let deathAnim = 0;
  let winReached= false;
  let camX = 0, camY = 2.5; // 카메라 스무딩

  // ── 입력 ──
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))
      e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  ['touchstart','mousedown'].forEach(ev => {
    document.getElementById('btn-left').addEventListener(ev,  e => { e.preventDefault(); keys['ArrowLeft']  = true; });
    document.getElementById('btn-right').addEventListener(ev, e => { e.preventDefault(); keys['ArrowRight'] = true; });
    document.getElementById('btn-jump').addEventListener(ev,  e => { e.preventDefault(); keys[' '] = true; });
  });
  ['touchend','touchcancel','mouseup'].forEach(ev => {
    document.getElementById('btn-left').addEventListener(ev,  e => { e.preventDefault(); keys['ArrowLeft']  = false; });
    document.getElementById('btn-right').addEventListener(ev, e => { e.preventDefault(); keys['ArrowRight'] = false; });
    document.getElementById('btn-jump').addEventListener(ev,  e => { e.preventDefault(); keys[' '] = false; });
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
      openGate(gate);
      // 관문이 열리면 위로 튀어오르게 (다시 올라갈 수 있도록)
      player.vy = JUMP_V * 0.75;
      player.onGround = false;
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

  function openGate(gate) {
    gate.open = true;
    gate.mat.color.set(0x2ecc71);
    gate.mat.transparent = true;
    gate.mat.opacity = 0.22;
    gate.lock.visible = false;
  }

  function closeMathPopup() {
    document.getElementById('math-popup').classList.add('hidden');
    mathOpen = false;
  }

  function respawn() {
    const fd = floorData.find(f => f.floor === player.checkpointFloor);
    if (!fd) return;
    player.x  = fd.checkpoint.cx;
    player.y  = fd.checkpoint.y + 0.15;
    player.vx = 0; player.vy = 0;
    deathAnim = 90;
    camX = player.x; camY = player.y + 2.5;
  }

  function triggerGameOver() {
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  function updateHUD() {
    document.getElementById('hearts-display').textContent =
      '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts);
    document.getElementById('floor-display').textContent = player.currentFloor + '층';
    document.getElementById('nickname-display').textContent = CharConfig.nickname;
  }

  // ── 충돌 가능 플랫폼 목록 ──
  function getActivePlats() {
    const list = [];
    floorData.forEach(fd => {
      fd.platforms.forEach(p => list.push(p));
      if (fd.gate && !fd.gate.open) list.push(fd.gate);
    });
    return list;
  }

  // ── 업데이트 ──
  function update() {
    if (mathOpen || winReached) return;
    if (deathAnim > 0) deathAnim--;

    // 입력
    if (keys['ArrowLeft'] || keys['a'])       player.vx = -MOVE_V;
    else if (keys['ArrowRight'] || keys['d']) player.vx =  MOVE_V;
    else player.vx *= 0.62;

    if ((keys[' '] || keys['ArrowUp'] || keys['w']) && player.onGround) {
      player.vy = JUMP_V;
      player.onGround = false;
    }

    // 중력
    player.vy = Math.max(player.vy - GRAV, MAX_VY);
    player.x += player.vx;
    player.y += player.vy;

    // 타워 벽
    const hw = TOWER_W / 2 - 0.22;
    if (player.x < -hw) { player.x = -hw; player.vx = 0; }
    if (player.x >  hw) { player.x =  hw; player.vx = 0; }

    // 플랫폼 착지 (위에서만)
    player.onGround = false;
    const plats = getActivePlats();
    for (const p of plats) {
      const xOk = player.x + 0.20 > p.cx - p.halfW && player.x - 0.20 < p.cx + p.halfW;
      const prevFeet = player.y - player.vy;
      const landing  = xOk && player.vy <= 0.01 && prevFeet >= p.topY - 0.05 && player.y <= p.topY + 0.08;

      if (landing) {
        player.y = p.topY;
        player.vy = 0;
        player.onGround = true;
        if (p.isGate && !p.open) showMath(p);
        break;
      }
    }

    // 추락
    if (player.y < -4) {
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
      if (Math.abs(player.x - cp.cx) < 2.5 && Math.abs(player.y - cp.y) < 1.8) {
        cp.reached = true;
        if (cp.flagMat) { cp.flagMat.color.set(cp.color); cp.flagMat.opacity = 1.0; }
        player.checkpointFloor = fd.floor;
        player.currentFloor    = fd.floor;
        updateHUD();
      }
    });

    // 클리어
    const topFD = floorData[floorData.length - 1];
    if (player.y > topFD.baseY + FLOOR_H_3D + 1) {
      winReached = true;
      document.getElementById('clear-screen').classList.remove('hidden');
      document.getElementById('clear-msg').textContent =
        CharConfig.nickname + '는 수포자가 아니에요! 🎉';
    }

    // 캐릭터 메시 동기화
    const blink = deathAnim > 0 && Math.floor(deathAnim / 6) % 2 === 0;
    charMesh.visible = !blink;
    charMesh.position.set(player.x, player.y, 0);

    // 이동 방향에 따라 캐릭터 좌우 회전
    if (player.vx > 0.02)       charMesh.rotation.y = 0;
    else if (player.vx < -0.02) charMesh.rotation.y = Math.PI;

    // 걷기 애니메이션
    if (Math.abs(player.vx) > 0.01 && player.onGround) player.walkAngle += 0.18;
    animateCharacter3D(charMesh, player.walkAngle, Math.abs(player.vx) > 0.01, player.onGround);

    // 카메라 스무딩
    const targetCX = player.x * 0.25;
    const targetCY = player.y + 2.4;
    camX += (targetCX - camX) * 0.10;
    camY += (targetCY - camY) * 0.10;
    cam.position.set(camX, camY, 9.0);
    cam.lookAt(player.x * 0.1, player.y + 0.6, 0);
  }

  // ── 게임 루프 ──
  function loop() {
    update();
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }

  // ── 공개 API ──
  return {
    start() {
      camX = 0; camY = 2.5;
      cam.position.set(0, camY, 9);
      cam.lookAt(0, 1, 0);
      updateHUD();
      loop();
    },
    restart() {
      // 관문·체크포인트 상태만 리셋 (메시 재사용)
      floorData.forEach(fd => {
        if (fd.gate && fd.gate.open) {
          fd.gate.open = false;
          fd.gate.mat.color.set(fd.gate.origColor);
          fd.gate.mat.transparent = false;
          fd.gate.mat.opacity = 1.0;
          fd.gate.lock.visible = true;
        }
        if (fd.checkpoint && fd.floor !== 0) {
          fd.checkpoint.reached = false;
          if (fd.checkpoint.flagMat) {
            fd.checkpoint.flagMat.color.set(fd.checkpoint.color);
            fd.checkpoint.flagMat.opacity = 0.35;
          }
        }
      });

      // 캐릭터 메시 교체 (캐릭터 선택이 바뀌었을 수 있음)
      scene.remove(charMesh);
      charMesh = createCharacter3D(CharConfig);
      charMesh.scale.setScalar(0.55);
      scene.add(charMesh);

      player    = makePlayer();
      hearts    = 3;
      mathOpen  = false;
      winReached= false;
      deathAnim = 0;
      camX = 0; camY = 2.5;
      updateHUD();
    }
  };
}
