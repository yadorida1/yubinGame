// 층별 수학 문제 생성
function generateMathQuestion(floor) {
  let question, answer, ops;

  if (floor <= 3) {
    // 1~3층: 덧셈/뺄셈 (1~20)
    ops = ['+', '-'];
  } else if (floor <= 6) {
    // 4~6층: 덧셈/뺄셈 (1~50) + 곱셈 (2~5단)
    ops = ['+', '-', '×'];
  } else if (floor <= 9) {
    // 7~9층: 곱셈 (2~9단) + 나눗셈
    ops = ['×', '÷', '+'];
  } else {
    // 10층: 혼합 계산
    ops = ['×', '÷', '+', '-'];
  }

  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b;

  switch (op) {
    case '+':
      a = rand(1, floor <= 3 ? 20 : 50);
      b = rand(1, floor <= 3 ? 20 : 50);
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;
    case '-':
      a = rand(floor <= 3 ? 5 : 10, floor <= 3 ? 30 : 80);
      b = rand(1, a);
      answer = a - b;
      question = `${a} - ${b} = ?`;
      break;
    case '×':
      a = rand(2, floor <= 6 ? 5 : 9);
      b = rand(2, floor <= 6 ? 5 : 9);
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;
    case '÷':
      b = rand(2, 9);
      answer = rand(2, 9);
      a = b * answer;
      question = `${a} ÷ ${b} = ?`;
      break;
  }

  // 오답 3개 생성 (겹치지 않게)
  const wrongs = new Set();
  while (wrongs.size < 3) {
    let w = answer + rand(-10, 10);
    if (w !== answer && w > 0) wrongs.add(w);
  }

  // 4개 선택지 섞기
  const options = shuffle([answer, ...wrongs]);
  return { question, answer, options };
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
