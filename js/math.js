// ── 층별 수학 문제 생성 (고난이도) ──
function generateMathQuestion(floor) {
  const type = pickType(floor);
  return buildQuestion(type, floor);
}

function pickType(floor) {
  if (floor <= 2) {
    // 1~2층: 두 자리 덧셈/뺄셈 (받아올림·받아내림 포함)
    return shuffle(['+2', '-2'])[0];
  } else if (floor <= 4) {
    // 3~4층: 세 자리 덧셈/뺄셈, 곱셈 7~9단
    return shuffle(['+3', '-3', '×hi'])[0];
  } else if (floor <= 6) {
    // 5~6층: 혼합식 (덧셈+곱셈), 어려운 나눗셈
    return shuffle(['mix+×', '÷hi', '×hi'])[0];
  } else if (floor <= 8) {
    // 7~8층: 세 수 연산, 괄호 혼합
    return shuffle(['3term', 'paren', '÷hi'])[0];
  } else if (floor === 9) {
    // 9층: 세 자리 × 한 자리, 두 자리 ÷, 괄호
    return shuffle(['3digit×', 'paren', '3term'])[0];
  } else {
    // 10층: 최고 난이도
    return shuffle(['3digit×', 'paren2', '3term2'])[0];
  }
}

function buildQuestion(type, floor) {
  let question, answer;

  switch (type) {
    case '+2': { // 두 자리 덧셈 (받아올림)
      const a = rand(25, 87), b = rand(15, 74);
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;
    }
    case '-2': { // 두 자리 뺄셈 (받아내림)
      const a = rand(40, 95), b = rand(17, a - 5);
      answer = a - b;
      question = `${a} - ${b} = ?`;
      break;
    }
    case '+3': { // 세 자리 덧셈
      const a = rand(120, 480), b = rand(110, 470);
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;
    }
    case '-3': { // 세 자리 뺄셈
      const a = rand(300, 900), b = rand(110, a - 50);
      answer = a - b;
      question = `${a} - ${b} = ?`;
      break;
    }
    case '×hi': { // 곱셈 7~9단
      const a = rand(7, 9), b = rand(6, 9);
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;
    }
    case '÷hi': { // 어려운 나눗셈
      const b = rand(6, 9), ans = rand(7, 12);
      const a = b * ans;
      answer = ans;
      question = `${a} ÷ ${b} = ?`;
      break;
    }
    case 'mix+×': { // 덧셈+곱셈 혼합 (a×b + c)
      const a = rand(7, 9), b = rand(6, 9), c = rand(10, 35);
      answer = a * b + c;
      question = `${a}×${b} + ${c} = ?`;
      break;
    }
    case '3term': { // 세 수 연산 (a + b - c 또는 a - b + c)
      const a = rand(50, 150), b = rand(20, 80), c = rand(10, 60);
      if (rand(0,1)) {
        answer = a + b - c;
        question = `${a} + ${b} - ${c} = ?`;
      } else {
        answer = a - b + c;
        question = `${a} - ${b} + ${c} = ?`;
      }
      if (answer <= 0) return buildQuestion('÷hi', floor);
      break;
    }
    case 'paren': { // 괄호 있는 혼합 (a × (b + c))
      const a = rand(3, 8), b = rand(5, 12), c = rand(3, 9);
      answer = a * (b + c);
      question = `${a} × (${b}+${c}) = ?`;
      break;
    }
    case '3digit×': { // 세 자리 × 한 자리
      const a = rand(12, 49), b = rand(7, 9);
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;
    }
    case 'paren2': { // 어려운 괄호: (a+b) × c - d
      const a = rand(5, 12), b = rand(4, 10), c = rand(6, 9), d = rand(5, 20);
      answer = (a + b) * c - d;
      question = `(${a}+${b})×${c} - ${d} = ?`;
      if (answer <= 0) return buildQuestion('3digit×', floor);
      break;
    }
    case '3term2': { // a×b + c×d
      const a = rand(6, 9), b = rand(6, 9), c = rand(3, 6), d = rand(4, 8);
      answer = a * b + c * d;
      question = `${a}×${b} + ${c}×${d} = ?`;
      break;
    }
    default: {
      const a = rand(10, 50), b = rand(5, 30);
      answer = a + b;
      question = `${a} + ${b} = ?`;
    }
  }

  // 오답: 답에서 가깝게 (헷갈리게)
  const range = Math.max(5, Math.round(answer * 0.12));
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const delta = rand(1, range) * (Math.random() < 0.5 ? 1 : -1);
    const w = answer + delta;
    if (w !== answer && w > 0) wrongs.add(w);
  }

  return { question, answer, options: shuffle([answer, ...wrongs]) };
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
