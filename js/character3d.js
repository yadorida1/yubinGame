// ── 3D 캐릭터 생성 (Three.js) ──

function hexToThreeColor(hex) {
  return new THREE.Color(hex);
}

function darkenColor(hex, factor) {
  const c = new THREE.Color(hex);
  c.r *= factor; c.g *= factor; c.b *= factor;
  return c;
}

function mat(color, options) {
  return new THREE.MeshLambertMaterial(Object.assign({ color }, options || {}));
}

function box(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

function createCharacter3D(config) {
  const c = config || CharConfig;
  const group = new THREE.Group();

  const skinC   = hexToThreeColor(c.skinColor);
  const hairC   = hexToThreeColor(c.hairColor);
  const clothC  = hexToThreeColor(c.outfitColor);
  const pantC   = darkenColor(c.outfitColor, 0.65);
  const shoeC   = new THREE.Color(0x222222);

  const skinM  = mat(skinC);
  const hairM  = mat(hairC);
  const clothM = mat(clothC);
  const pantM  = mat(pantC);
  const shoeM  = mat(shoeC);
  const darkM  = mat(new THREE.Color(0x333333));
  const whiteM = mat(new THREE.Color(0xffffff));

  // ── 신발 ──
  const shoeL = new THREE.Mesh(box(0.20, 0.10, 0.30), shoeM);
  const shoeR = new THREE.Mesh(box(0.20, 0.10, 0.30), shoeM);
  shoeL.position.set(-0.11, 0.05, 0.02);
  shoeR.position.set( 0.11, 0.05, 0.02);
  group.add(shoeL, shoeR);

  // ── 다리 ──
  const legL = new THREE.Mesh(box(0.17, 0.44, 0.19), pantM);
  const legR = new THREE.Mesh(box(0.17, 0.44, 0.19), pantM);
  legL.position.set(-0.11, 0.32, 0);
  legR.position.set( 0.11, 0.32, 0);
  group.add(legL, legR);

  // ── 몸통 (옷 스타일별) ──
  addBody3D(group, c, clothM, skinM, whiteM);

  // ── 팔 ──
  const armL = new THREE.Mesh(box(0.15, 0.44, 0.17), clothM);
  const armR = new THREE.Mesh(box(0.15, 0.44, 0.17), clothM);
  armL.position.set(-0.31, 0.86, 0);
  armR.position.set( 0.31, 0.86, 0);
  group.add(armL, armR);

  // 손
  const handL = new THREE.Mesh(box(0.13, 0.12, 0.13), skinM);
  const handR = new THREE.Mesh(box(0.13, 0.12, 0.13), skinM);
  handL.position.set(-0.31, 0.59, 0);
  handR.position.set( 0.31, 0.59, 0);
  group.add(handL, handR);

  // ── 목 ──
  const neck = new THREE.Mesh(box(0.13, 0.11, 0.13), skinM);
  neck.position.y = 1.18;
  group.add(neck);

  // ── 머리 (둥글납작한 박스) ──
  const head = new THREE.Mesh(box(0.42, 0.42, 0.38), skinM);
  head.position.y = 1.47;
  group.add(head);

  // 눈
  const eyeGeo = box(0.075, 0.095, 0.05);
  const eyeL = new THREE.Mesh(eyeGeo, darkM);
  const eyeR = new THREE.Mesh(eyeGeo, darkM);
  eyeL.position.set(-0.11, 1.49, 0.20);
  eyeR.position.set( 0.11, 1.49, 0.20);
  group.add(eyeL, eyeR);

  // 눈 하이라이트
  const hlGeo = box(0.03, 0.03, 0.03);
  const hlL = new THREE.Mesh(hlGeo, whiteM);
  const hlR = new THREE.Mesh(hlGeo, whiteM);
  hlL.position.set(-0.08, 1.52, 0.22);
  hlR.position.set( 0.14, 1.52, 0.22);
  group.add(hlL, hlR);

  // 볼 (여자)
  if (c.gender === 'female') {
    const blushM = mat(new THREE.Color(0xff9999), { transparent: true, opacity: 0.5 });
    const blL = new THREE.Mesh(box(0.09, 0.055, 0.03), blushM);
    const blR = new THREE.Mesh(box(0.09, 0.055, 0.03), blushM);
    blL.position.set(-0.17, 1.43, 0.20);
    blR.position.set( 0.17, 1.43, 0.20);
    group.add(blL, blR);
  }

  // 입 (작은 짙은 선)
  const mouthM = mat(new THREE.Color(0x994444));
  const mouth = new THREE.Mesh(box(0.12, 0.025, 0.03), mouthM);
  mouth.position.set(0, 1.38, 0.20);
  group.add(mouth);

  // ── 머리카락 ──
  addHair3D(group, c, hairM, skinM);

  // 애니메이션용 파트 저장
  group.userData.legL  = legL;
  group.userData.legR  = legR;
  group.userData.armL  = armL;
  group.userData.armR  = armR;

  return group;
}

function addBody3D(group, c, clothM, skinM, whiteM) {
  switch (c.outfit) {
    case 'school': {
      // 흰 셔츠 + 색 재킷 양쪽
      const shirt = new THREE.Mesh(box(0.44, 0.52, 0.23), mat(new THREE.Color(0xffffff)));
      shirt.position.y = 0.88;
      group.add(shirt);
      const jacketL = new THREE.Mesh(box(0.13, 0.52, 0.24), clothM);
      const jacketR = new THREE.Mesh(box(0.13, 0.52, 0.24), clothM);
      jacketL.position.set(-0.155, 0.88, 0);
      jacketR.position.set( 0.155, 0.88, 0);
      group.add(jacketL, jacketR);
      // 넥타이
      const tieM = mat(new THREE.Color(0xe74c3c));
      const tie = new THREE.Mesh(box(0.055, 0.28, 0.05), tieM);
      tie.position.set(0, 0.88, 0.14);
      group.add(tie);
      break;
    }
    case 'sports': {
      const body = new THREE.Mesh(box(0.44, 0.52, 0.23), clothM);
      body.position.y = 0.88;
      group.add(body);
      // 세로 줄
      const stripeM = mat(new THREE.Color(0xffffff));
      const stripe = new THREE.Mesh(box(0.055, 0.50, 0.25), stripeM);
      stripe.position.y = 0.88;
      group.add(stripe);
      // 가로 줄
      const hStripe = new THREE.Mesh(box(0.46, 0.055, 0.25), stripeM);
      hStripe.position.y = 0.88;
      group.add(hStripe);
      break;
    }
    case 'hero': {
      const body = new THREE.Mesh(box(0.44, 0.52, 0.23), clothM);
      body.position.y = 0.88;
      group.add(body);
      // 망토
      const capeC = darkenColor(c.outfitColor, 1.4);
      capeC.r = Math.min(1, capeC.r); capeC.g = Math.min(1, capeC.g); capeC.b = Math.min(1, capeC.b);
      const capeM = mat(capeC);
      const cape = new THREE.Mesh(box(0.50, 0.75, 0.06), capeM);
      cape.position.set(0, 0.82, -0.16);
      group.add(cape);
      // 별
      const starM = mat(new THREE.Color(0xffd700));
      const star  = new THREE.Mesh(box(0.10, 0.10, 0.05), starM);
      star.position.set(0, 0.92, 0.14);
      group.add(star);
      break;
    }
    default: { // casual
      const body = new THREE.Mesh(box(0.44, 0.52, 0.23), clothM);
      body.position.y = 0.88;
      group.add(body);
      // 포켓
      const pocketM = mat(darkenColor(c.outfitColor, 0.8));
      const pocket = new THREE.Mesh(box(0.12, 0.10, 0.06), pocketM);
      pocket.position.set(0.12, 0.90, 0.14);
      group.add(pocket);
      break;
    }
  }
}

function addHair3D(group, c, hairM, skinM) {
  if (c.gender === 'female') {
    // 공통: 위쪽 머리
    const top = new THREE.Mesh(box(0.46, 0.18, 0.42), hairM);
    top.position.y = 1.72;
    group.add(top);

    if (c.hair === 'long') {
      // 옆 긴 머리
      const sideL = new THREE.Mesh(box(0.08, 0.88, 0.40), hairM);
      const sideR = new THREE.Mesh(box(0.08, 0.88, 0.40), hairM);
      sideL.position.set(-0.27, 1.22, 0);
      sideR.position.set( 0.27, 1.22, 0);
      group.add(sideL, sideR);
      // 뒷 머리
      const back = new THREE.Mesh(box(0.44, 0.88, 0.07), hairM);
      back.position.set(0, 1.22, -0.22);
      group.add(back);
      // 앞머리
      const bang = new THREE.Mesh(box(0.42, 0.10, 0.07), hairM);
      bang.position.set(0, 1.60, 0.22);
      group.add(bang);
    } else {
      // 짧은 머리 옆
      const sideL = new THREE.Mesh(box(0.08, 0.40, 0.40), hairM);
      const sideR = new THREE.Mesh(box(0.08, 0.40, 0.40), hairM);
      sideL.position.set(-0.27, 1.47, 0);
      sideR.position.set( 0.27, 1.47, 0);
      group.add(sideL, sideR);
      const bang = new THREE.Mesh(box(0.42, 0.10, 0.07), hairM);
      bang.position.set(0, 1.58, 0.22);
      group.add(bang);
    }
  } else {
    if (c.hair === 'bowl') {
      // 바가지 머리: 위 + 사방 테두리
      const top = new THREE.Mesh(box(0.47, 0.18, 0.43), hairM);
      top.position.y = 1.72;
      group.add(top);
      const sideL = new THREE.Mesh(box(0.09, 0.20, 0.43), hairM);
      const sideR = new THREE.Mesh(box(0.09, 0.20, 0.43), hairM);
      sideL.position.set(-0.27, 1.58, 0);
      sideR.position.set( 0.27, 1.58, 0);
      group.add(sideL, sideR);
      const frontB = new THREE.Mesh(box(0.44, 0.20, 0.08), hairM);
      frontB.position.set(0, 1.58, 0.23);
      group.add(frontB);
      const backB = new THREE.Mesh(box(0.44, 0.20, 0.08), hairM);
      backB.position.set(0, 1.58, -0.23);
      group.add(backB);
    } else {
      // 대머리: 반짝임만
      const shineM = mat(new THREE.Color(0xffffff), { transparent: true, opacity: 0.3 });
      const shine = new THREE.Mesh(box(0.09, 0.055, 0.05), shineM);
      shine.position.set(-0.06, 1.72, 0.14);
      group.add(shine);
    }
  }
}

// 캐릭터 걷기 애니메이션
function animateCharacter3D(mesh, walkAngle, isMoving, isOnGround) {
  const { legL, legR, armL, armR } = mesh.userData;
  if (!legL) return;

  if (isMoving && isOnGround) {
    const swing = Math.sin(walkAngle) * 0.45;
    legL.rotation.x =  swing;
    legR.rotation.x = -swing;
    armL.rotation.x = -swing * 0.6;
    armR.rotation.x =  swing * 0.6;
  } else {
    legL.rotation.x *= 0.7;
    legR.rotation.x *= 0.7;
    armL.rotation.x *= 0.7;
    armR.rotation.x *= 0.7;
  }
}
