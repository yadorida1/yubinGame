// 캐릭터 설정 저장소
const CharConfig = {
  gender: 'female',
  hair: 'long',
  hairColor: '#3d1c02',
  skinColor: '#f5cba7',
  outfit: 'casual',
  outfitColor: '#3498db',
  nickname: '모험가',
};

// 캔버스에 캐릭터 그리기
function drawCharacter(ctx, x, y, scale, config) {
  const s = scale || 1;
  const c = config || CharConfig;

  ctx.save();
  ctx.translate(x, y);

  const skin = c.skinColor;
  const hair = c.hairColor;
  const cloth = c.outfitColor;

  // 다리
  const pantColor = shadeColor(cloth, -30);
  ctx.fillStyle = pantColor;
  ctx.fillRect(-7*s, 20*s, 6*s, 18*s);
  ctx.fillRect(2*s,  20*s, 6*s, 18*s);

  // 신발
  ctx.fillStyle = '#222';
  ctx.fillRect(-8*s, 36*s, 8*s, 5*s);
  ctx.fillRect(1*s,  36*s, 8*s, 5*s);

  // 몸통 (옷)
  drawOutfit(ctx, s, cloth, c.outfit, c.gender);

  // 목
  ctx.fillStyle = skin;
  ctx.fillRect(-3*s, 2*s, 6*s, 5*s);

  // 머리
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, -8*s, 11*s, 12*s, 0, 0, Math.PI*2);
  ctx.fill();

  // 눈
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.ellipse(-4*s, -9*s, 2*s, 2.5*s, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4*s, -9*s, 2*s, 2.5*s, 0, 0, Math.PI*2);
  ctx.fill();

  // 눈 하이라이트
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-3*s, -10*s, 0.8*s, 0.8*s, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5*s, -10*s, 0.8*s, 0.8*s, 0, 0, Math.PI*2);
  ctx.fill();

  // 볼 (여자만)
  if (c.gender === 'female') {
    ctx.fillStyle = 'rgba(255,150,150,0.4)';
    ctx.beginPath();
    ctx.ellipse(-7*s, -6*s, 3.5*s, 2.5*s, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(7*s, -6*s, 3.5*s, 2.5*s, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // 입
  ctx.strokeStyle = '#a0522d';
  ctx.lineWidth = 1.2*s;
  ctx.beginPath();
  ctx.arc(0, -4*s, 3.5*s, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // 머리카락
  drawHair(ctx, s, hair, c.hair, c.gender, skin);

  ctx.restore();
}

function drawOutfit(ctx, s, cloth, outfit, gender) {
  switch(outfit) {
    case 'school':
      // 교복: 흰 셔츠 + 색 재킷
      ctx.fillStyle = '#fff';
      ctx.fillRect(-10*s, 0, 20*s, 22*s);
      ctx.fillStyle = cloth;
      ctx.fillRect(-10*s, 0, 5*s, 22*s);   // 왼쪽 자켓
      ctx.fillRect(5*s,   0, 5*s, 22*s);   // 오른쪽 자켓
      // 넥타이
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(-2*s, 2*s);
      ctx.lineTo(2*s, 2*s);
      ctx.lineTo(1*s, 14*s);
      ctx.lineTo(-1*s, 14*s);
      ctx.closePath();
      ctx.fill();
      break;
    case 'sports':
      // 운동복
      ctx.fillStyle = cloth;
      ctx.fillRect(-10*s, 0, 20*s, 22*s);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-1.5*s, 2*s, 3*s, 18*s); // 세로 줄
      ctx.fillRect(-10*s, 10*s, 20*s, 3*s); // 가로 줄
      break;
    case 'hero':
      // 영웅복 (망토)
      ctx.fillStyle = cloth;
      ctx.fillRect(-10*s, 0, 20*s, 22*s);
      // 망토
      ctx.fillStyle = shadeColor(cloth, 40);
      ctx.beginPath();
      ctx.moveTo(-10*s, 0);
      ctx.lineTo(10*s, 0);
      ctx.lineTo(14*s, 30*s);
      ctx.lineTo(-14*s, 30*s);
      ctx.closePath();
      ctx.fill();
      // 별 로고
      ctx.fillStyle = '#ffd700';
      drawStar(ctx, 0, 10*s, 4*s);
      break;
    default: // casual
      ctx.fillStyle = cloth;
      ctx.fillRect(-10*s, 0, 20*s, 22*s);
      // 포켓
      ctx.fillStyle = shadeColor(cloth, -20);
      ctx.fillRect(3*s, 5*s, 5*s, 5*s);
      break;
  }
}

function drawHair(ctx, s, hair, style, gender, skinColor) {
  ctx.fillStyle = hair;
  if (gender === 'female') {
    if (style === 'long') {
      // 긴 머리: 양 옆으로 흘러내림
      ctx.beginPath();
      ctx.ellipse(0, -16*s, 12*s, 8*s, 0, Math.PI, 0); // 위 반원
      ctx.fill();
      // 왼쪽 긴 머리
      ctx.fillRect(-13*s, -16*s, 6*s, 42*s);
      // 오른쪽 긴 머리
      ctx.fillRect(7*s, -16*s, 6*s, 42*s);
      // 앞머리
      ctx.fillRect(-11*s, -19*s, 22*s, 8*s);
    } else {
      // 짧은 머리
      ctx.beginPath();
      ctx.ellipse(0, -15*s, 12*s, 9*s, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-12*s, -15*s, 24*s, 10*s);
      // 귀 뒤로 짧게
      ctx.fillRect(-13*s, -12*s, 5*s, 12*s);
      ctx.fillRect(8*s,  -12*s, 5*s, 12*s);
    }
  } else {
    if (style === 'bowl') {
      // 바가지 머리
      ctx.beginPath();
      ctx.arc(0, -10*s, 12*s, Math.PI, 0);
      ctx.fillRect(-12*s, -10*s, 24*s, 6*s);
      ctx.fill();
    } else {
      // 대머리: 약간 반짝임만
      ctx.fillStyle = shadeColor(skinColor || '#f5cba7', 10);
      ctx.beginPath();
      ctx.ellipse(0, -8*s, 11*s, 12*s, 0, 0, Math.PI*2);
      ctx.fill();
      // 반짝임
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(-3*s, -14*s, 3*s, 2*s, -0.5, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
    const b = (i * 4 * Math.PI / 5 + 2 * Math.PI / 5) - Math.PI / 2;
    i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
            : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
    ctx.lineTo(cx + (r*0.4)*Math.cos(b), cy + (r*0.4)*Math.sin(b));
  }
  ctx.closePath();
  ctx.fill();
}

function shadeColor(hex, pct) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (n>>16) + pct));
  const g = Math.min(255, Math.max(0, ((n>>8)&0xff) + pct));
  const b = Math.min(255, Math.max(0, (n&0xff) + pct));
  return `rgb(${r},${g},${b})`;
}

// ── 캐릭터 선택 UI 초기화 ──
function initCharacterSelect() {
  const preview = document.getElementById('character-preview');
  const pctx = preview.getContext('2d');

  function redraw() {
    pctx.clearRect(0, 0, preview.width, preview.height);
    drawCharacter(pctx, preview.width/2, preview.height * 0.58, 2.2, CharConfig);
  }

  // 버튼 클릭 처리
  document.querySelectorAll('.sel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;

      // 같은 그룹 active 해제
      document.querySelectorAll(`.sel-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CharConfig[group] = value;

      // 성별 바뀌면 머리스타일 패널 전환
      if (group === 'gender') {
        const isFemale = value === 'female';
        document.getElementById('hair-female').classList.toggle('hidden', !isFemale);
        document.getElementById('hair-male').classList.toggle('hidden', isFemale);
        document.getElementById('hair-color-group').classList.toggle('hidden', value === 'male' && CharConfig.hair === 'bald');
        // 머리 기본값 설정
        CharConfig.hair = isFemale ? 'long' : 'bowl';
        document.querySelectorAll(`.sel-btn[data-group="hair"]`).forEach((b,i) => b.classList.toggle('active', i===0));
      }
      if (group === 'hair' && CharConfig.gender === 'male') {
        document.getElementById('hair-color-group').classList.toggle('hidden', value === 'bald');
      }

      redraw();
    });
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      document.querySelectorAll(`.color-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CharConfig[group] = btn.dataset.value;
      redraw();
    });
  });

  document.getElementById('nickname-input').addEventListener('input', e => {
    CharConfig.nickname = e.target.value || '모험가';
  });

  redraw();
}
