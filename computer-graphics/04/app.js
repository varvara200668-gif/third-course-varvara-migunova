
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

let steps = [];

function getCode(x, y, rect) {
  let code = INSIDE;

  if (x < rect.xmin) {
    code |= LEFT;
  } else if (x > rect.xmax) {
    code |= RIGHT;
  }

  if (y < rect.ymin) {
    code |= TOP;
  } else if (y > rect.ymax) {
    code |= BOTTOM;
  }

  return code;
}

function codeText(code) {
  return code.toString(2).padStart(4, "0");
}

function pointText(x, y) {
  return "(" + x.toFixed(1) + "; " + y.toFixed(1) + ")";
}

function addStep(name, number, x1, y1, code1, x2, y2, code2, action) {
  if (name === "") return;

  steps.push([
    name + ", " + number,
    pointText(x1, y1),
    codeText(code1),
    pointText(x2, y2),
    codeText(code2),
    action
  ]);
}

function clipLine(x1, y1, x2, y2, rect, name = "") {
  let code1 = getCode(x1, y1, rect);
  let code2 = getCode(x2, y2, rect);
  let number = 1;

  while (true) {
    if ((code1 | code2) === 0) {
      addStep(name, number, x1, y1, code1, x2, y2, code2, "ACCEPT");
      return { x1, y1, x2, y2 };
    }

    if ((code1 & code2) !== 0) {
      addStep(name, number, x1, y1, code1, x2, y2, code2, "REJECT");
      return null;
    }

    const codeOut = code1 !== 0 ? code1 : code2;

    let x;
    let y;
    let side;

    if (codeOut & TOP) {
      const t = (rect.ymin - y1) / (y2 - y1);
      x = x1 + t * (x2 - x1);
      y = rect.ymin;
      side = "TOP";
    } else if (codeOut & BOTTOM) {
      const t = (rect.ymax - y1) / (y2 - y1);
      x = x1 + t * (x2 - x1);
      y = rect.ymax;
      side = "BOTTOM";
    } else if (codeOut & RIGHT) {
      const t = (rect.xmax - x1) / (x2 - x1);
      x = rect.xmax;
      y = y1 + t * (y2 - y1);
      side = "RIGHT";
    } else {
      const t = (rect.xmin - x1) / (x2 - x1);
      x = rect.xmin;
      y = y1 + t * (y2 - y1);
      side = "LEFT";
    }

    addStep(name, number, x1, y1, code1, x2, y2, code2, "пересечение " + side);

    if (codeOut === code1) {
      x1 = x;
      y1 = y;
      code1 = getCode(x1, y1, rect);
    } else {
      x2 = x;
      y2 = y;
      code2 = getCode(x2, y2, rect);
    }

    number++;
  }
}

function readNumber(id) {
  const value = document.getElementById(id).value;
  if (value.trim() === "") return NaN;
  return Number(value);
}

function getRect() {
  const rect = {
    xmin: readNumber("xmin"),
    xmax: readNumber("xmax"),
    ymin: readNumber("ymin"),
    ymax: readNumber("ymax")
  };

  if (!Number.isFinite(rect.xmin) || !Number.isFinite(rect.xmax) ||
      !Number.isFinite(rect.ymin) || !Number.isFinite(rect.ymax) ||
      rect.xmin >= rect.xmax || rect.ymin >= rect.ymax) {
    document.getElementById("message").textContent =
      "Ошибка: проверьте границы окна (xmin < xmax, ymin < ymax).";
    return null;
  }

  document.getElementById("message").textContent = "";
  return rect;
}

function drawLine(x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawWindow(rect) {
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.xmin, rect.ymin,
                 rect.xmax - rect.xmin, rect.ymax - rect.ymin);
}

function showSteps() {
  let html = "";

  for (let i = 0; i < steps.length; i++) {
    html += "<tr>";
    for (let j = 0; j < 6; j++) {
      html += "<td>" + steps[i][j] + "</td>";
    }
    html += "</tr>";
  }

  if (html === "") {
    html = "<tr><td colspan='6'>Для эксперимента показывается только статистика.</td></tr>";
  }

  document.getElementById("stepsBody").innerHTML = html;
}

function showLine() {
  const rect = getRect();
  if (rect === null) return;

  const x1 = readNumber("x1");
  const y1 = readNumber("y1");
  const x2 = readNumber("x2");
  const y2 = readNumber("y2");

  if (!Number.isFinite(x1) || !Number.isFinite(y1) ||
      !Number.isFinite(x2) || !Number.isFinite(y2)) {
    document.getElementById("message").textContent =
      "Ошибка: введите все координаты отрезка.";
    return;
  }

  const code1 = getCode(x1, y1, rect);
  const code2 = getCode(x2, y2, rect);

  steps = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawLine(x1, y1, x2, y2, "#aaaaaa", 2);

  const result = clipLine(x1, y1, x2, y2, rect, "Отрезок");

  if (result !== null) {
    drawLine(result.x1, result.y1, result.x2, result.y2, "#1466cc", 4);
  }

  drawWindow(rect);

  document.getElementById("codes").textContent =
    "Исходные коды: A = " + codeText(code1) + ", B = " + codeText(code2);

  let text;

  if (result === null) {
    text = "Результат: REJECT — отрезок отброшен.";
  } else if (code1 === 0 && code2 === 0) {
    text = "Результат: ACCEPT — весь отрезок внутри.";
  } else {
    text = "Результат: отсечён. A = " + pointText(result.x1, result.y1) +
           ", B = " + pointText(result.x2, result.y2);
  }

  document.getElementById("result").textContent = text;
  showSteps();
}

function showPolyline() {
  const rect = getRect();
  if (rect === null) return;

  const points = [
    { x: 50, y: 220 },
    { x: 210, y: 60 },
    { x: 320, y: 340 },
    { x: 520, y: 180 },
    { x: 560, y: 370 }
  ];

  steps = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < points.length - 1; i++) {
    drawLine(points[i].x, points[i].y,
             points[i + 1].x, points[i + 1].y, "#aaaaaa", 2);
  }

  let visible = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const result = clipLine(a.x, a.y, b.x, b.y, rect,
                            "P" + i + "-P" + (i + 1));

    if (result !== null) {
      visible++;
      drawLine(result.x1, result.y1, result.x2, result.y2, "#1466cc", 4);
    }
  }

  drawWindow(rect);

  document.getElementById("codes").textContent =
    "Ломаная: 5 точек, 4 отрезка.";

  document.getElementById("result").textContent =
    "Видимых частей ломаной: " + visible + ".";

  showSteps();
}

function runExperiment() {
  const rect = getRect();
  if (rect === null) return;

  const lines = [];

  for (let i = 0; i < 50; i++) {
    lines.push({
      x1: Math.random() * 600,
      y1: Math.random() * 400,
      x2: Math.random() * 600,
      y2: Math.random() * 400
    });
  }

  steps = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < lines.length; i++) {
    const a = lines[i];
    drawLine(a.x1, a.y1, a.x2, a.y2, "#aaaaaa", 1);
  }

  let accepted = 0;
  let clipped = 0;
  let rejected = 0;

  for (let i = 0; i < lines.length; i++) {
    const a = lines[i];

    const code1 = getCode(a.x1, a.y1, rect);
    const code2 = getCode(a.x2, a.y2, rect);

    const result = clipLine(a.x1, a.y1, a.x2, a.y2, rect);

    if (result === null) {
      rejected++;
    } else {
      if (code1 === 0 && code2 === 0) {
        accepted++;
      } else {
        clipped++;
      }

      drawLine(result.x1, result.y1, result.x2, result.y2, "#1466cc", 2);
    }
  }

  drawWindow(rect);

  document.getElementById("codes").textContent =
    "Сгенерировано 50 случайных отрезков.";

  document.getElementById("result").textContent =
    "Принято без изменения: " + accepted +
    "; отсечено: " + clipped +
    "; отброшено: " + rejected + ".";

  showSteps();
}

const tests = [
  [200, 150, 380, 250],
  [20, 130, 120, 290],
  [220, 20, 400, 60],
  [80, 200, 300, 200],
  [50, 200, 550, 200],
  [50, 0, 250, 200],
  [280, 30, 280, 380],
  [50, 250, 550, 250],
  [50, 150, 550, 250]
];

function loadTest() {
  const number = Number(document.getElementById("test").value);
  const test = tests[number];

  document.getElementById("x1").value = test[0];
  document.getElementById("y1").value = test[1];
  document.getElementById("x2").value = test[2];
  document.getElementById("y2").value = test[3];

  showLine();
}

showLine();
