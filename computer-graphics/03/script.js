const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const cell = 15;
const maxX = 40;
const maxY = 30;

const stepSelect = document.getElementById('step');
const highlight = document.getElementById('highlight');

let current = null;
let steps = [];

function putPixel(x, y, color = '#2674bc') {
  ctx.fillStyle = color;
  ctx.fillRect(
    x * cell + 1,
    (maxY - y) * cell + 1,
    cell - 2,
    cell - 2
  );
}

function symmetricPoints(cx, cy, x, y) {
  return [
    [cx + x, cy + y],
    [cx + y, cy + x],
    [cx - x, cy + y],
    [cx - y, cy + x],
    [cx + x, cy - y],
    [cx + y, cy - x],
    [cx - x, cy - y],
    [cx - y, cy - x]
  ];
}

function plot8(cx, cy, x, y, color = '#2674bc') {
  const points = symmetricPoints(cx, cy, x, y);

  for (const p of points) {
    putPixel(p[0], p[1], color);
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ddd';
  ctx.beginPath();

  for (let x = 0; x <= maxX + 1; x++) {
    ctx.moveTo(x * cell, 0);
    ctx.lineTo(x * cell, canvas.height);
  }

  for (let y = 0; y <= maxY + 1; y++) {
    ctx.moveTo(0, y * cell);
    ctx.lineTo(canvas.width, y * cell);
  }

  ctx.stroke();
}

function midpointPoints(r, saveSteps = false) {
  const points = [];

  let x = 0;
  let y = r;
  let d = 1 - r;

  while (x <= y) {
    points.push([x, y]);

    const before = d;
    const oldY = y;
    let choice;

    if (d < 0) {
      d += 2 * x + 3;
      choice = 'E';
    } else {
      d += 2 * (x - y) + 5;
      y -= 1;
      choice = 'SE';
    }

    if (saveSteps) {
      steps.push({
        x: x,
        y: oldY,
        before: before,
        choice: choice,
        after: d
      });
    }

    x += 1;
  }

  return points;
}

function circleMidpoint(cx, cy, r) {
  steps = [];
  const points = midpointPoints(r, true);

  for (const p of points) {
    plot8(cx, cy, p[0], p[1]);
  }
}

function formulaPoints(r) {
  const points = [];

  for (let x = 0; ; x++) {
    const y = Math.round(Math.sqrt(r * r - x * x));

    if (x > y) {
      break;
    }

    points.push([x, y]);
  }

  return points;
}

function circleFormula(cx, cy, r) {
  const points = formulaPoints(r);

  for (const p of points) {
    plot8(cx, cy, p[0], p[1]);
  }
}

function showCircle() {
  drawGrid();
  document.getElementById('points').textContent = '';

  if (current === null) {
    return;
  }

  const cx = current.cx;
  const cy = current.cy;

  for (const s of current.steps) {
    plot8(cx, cy, s.x, s.y);
  }

  if (highlight.checked) {
    const number = Number(stepSelect.value);
    const s = current.steps[number];

    plot8(cx, cy, s.x, s.y, '#d93232');

    const points = symmetricPoints(cx, cy, s.x, s.y);
    let text = 'Базовая точка: (' + s.x + ', ' + s.y + '). Точки: ';

    for (const p of points) {
      text += '(' + p[0] + ', ' + p[1] + ') ';
    }

    document.getElementById('points').textContent = text;
  }
}

function build() {
  const cxInput = document.getElementById('cx').value;
  const cyInput = document.getElementById('cy').value;
  const rInput = document.getElementById('radius').value;

  const cx = Number(cxInput);
  const cy = Number(cyInput);
  const r = Number(rInput);

  const message = document.getElementById('message');

  if (
    cxInput === '' ||
    cyInput === '' ||
    rInput === '' ||
    !Number.isSafeInteger(cx) ||
    !Number.isSafeInteger(cy) ||
    !Number.isSafeInteger(r) ||
    r <= 0
  ) {
    message.textContent = 'Введите целые координаты и целый радиус r > 0.';
    return;
  }

  if (
    cx - r < 0 ||
    cx + r > maxX ||
    cy - r < 0 ||
    cy + r > maxY
  ) {
    message.textContent = 'Окружность выходит за границы области.';
    return;
  }

  drawGrid();
  circleMidpoint(cx, cy, r);

  current = {
    cx: cx,
    cy: cy,
    steps: steps
  };

  let table = '';
  let options = '';

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];

    table += `
      <tr>
        <td>${i}</td>
        <td>${s.x}</td>
        <td>${s.y}</td>
        <td>${s.before}</td>
        <td>${s.choice}</td>
        <td>${s.after}</td>
      </tr>
    `;

    options += `<option value="${i}">${i}</option>`;
  }

  document.getElementById('steps').innerHTML = table;
  stepSelect.innerHTML = options;
  message.textContent = 'Окружность построена.';

  showCircle();
}

function collectPixels(points) {
  const pixels = new Set();

  for (const p of points) {
    const symmetric = symmetricPoints(0, 0, p[0], p[1]);

    for (const pixel of symmetric) {
      pixels.add(pixel[0] + ',' + pixel[1]);
    }
  }

  return pixels;
}

let checksum = 0;

function measure(method, r) {
  const start = performance.now();

  for (let i = 0; i < 10000; i++) {
    const points = method(r);
    checksum += points.length;
  }

  return performance.now() - start;
}

function compare() {
  let table = '';

  for (const r of [1, 5, 8, 10]) {
    const pointsA = midpointPoints(r);
    const pointsB = formulaPoints(r);

    const a = collectPixels(pointsA);
    const b = collectPixels(pointsB);

    let same = a.size === b.size;

    for (const p of a) {
      if (!b.has(p)) {
        same = false;
      }
    }

    measure(midpointPoints, r);
    measure(formulaPoints, r);

    const timesA = [];
    const timesB = [];

    for (let series = 0; series < 5; series++) {
      if (series % 2 === 0) {
        timesA.push(measure(midpointPoints, r).toFixed(3));
        timesB.push(measure(formulaPoints, r).toFixed(3));
      } else {
        timesB.push(measure(formulaPoints, r).toFixed(3));
        timesA.push(measure(midpointPoints, r).toFixed(3));
      }
    }

    table += `
      <tr>
        <td>${r}</td>
        <td>${pointsA.length} / ${pointsB.length}</td>
        <td>${a.size} / ${b.size}</td>
        <td>${same ? 'Да' : 'Нет'}</td>
        <td>${timesA.join('; ')}</td>
        <td>${timesB.join('; ')}</td>
      </tr>
    `;
  }

  document.getElementById('comparison').innerHTML = table;
}

document.getElementById('draw').onclick = build;

document.getElementById('clear').onclick = function () {
  current = null;
  steps = [];

  drawGrid();

  document.getElementById('steps').innerHTML = '';
  document.getElementById('points').textContent = '';
  document.getElementById('message').textContent = 'Canvas очищен.';
  stepSelect.innerHTML = '';
};

highlight.onchange = showCircle;
stepSelect.onchange = showCircle;
document.getElementById('compare').onclick = compare;

build();