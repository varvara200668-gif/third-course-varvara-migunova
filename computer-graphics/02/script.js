const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let pixels = [];
let rows = [];
let collectSteps = false;
let measuring = false;

const buffer = new Uint32Array(50 * 50);

function putPixel(x, y) {
    if (measuring) {
        buffer[y * 50 + x]++;
    } else {
        pixels.push([x, y]);
    }
}

function lineDDA(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) {
        putPixel(x1, y1);
        return;
    }

    const xStep = dx / steps;
    const yStep = dy / steps;

    let x = x1;
    let y = y1;

    for (let i = 0; i <= steps; i++) {
        putPixel(Math.round(x), Math.round(y));

        x += xStep;
        y += yStep;
    }
}

function lineBresenham(x1, y1, x2, y2) {
    let x = x1;
    let y = y1;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;

    let error = dx - dy;

    while (true) {
        putPixel(x, y);

        if (x === x2 && y === y2) {
            if (collectSteps) {
                rows.push([
                    rows.length,
                    x,
                    y,
                    error,
                    '—',
                    '—',
                    '—'
                ]);
            }

            break;
        }

        const error2 = 2 * error;

        if (collectSteps) {
            rows.push([
                rows.length,
                x,
                y,
                error,
                error2,
                error2 > -dy ? 'Да' : 'Нет',
                error2 < dx ? 'Да' : 'Нет'
            ]);
        }

        if (error2 > -dy) {
            error -= dy;
            x += sx;
        }

        if (error2 < dx) {
            error += dx;
            y += sy;
        }
    }
}

function readCoordinates() {
    const values = ['x1', 'y1', 'x2', 'y2'].map(id => {
        const value = document.getElementById(id).value.trim();

        return value === '' ? NaN : Number(value);
    });

    const valid = values.every(value =>
        Number.isInteger(value) && value >= 0 && value <= 49
    );

    if (!valid) {
        document.getElementById('errorMessage').textContent =
            'Введите целые координаты от 0 до 49.';

        return null;
    }

    document.getElementById('errorMessage').textContent = '';

    return values;
}

function getPixels(algorithm, coordinates) {
    pixels = [];

    algorithm(...coordinates);

    return pixels;
}

function formatPixels(points) {
    return points
        .map(point => `(${point[0]}, ${point[1]})`)
        .join('\n');
}

function addRow(body, values) {
    const row = document.createElement('tr');

    for (const value of values) {
        const cell = document.createElement('td');

        cell.textContent = value;
        row.appendChild(cell);
    }

    body.appendChild(row);

    return row;
}

function draw() {
    const coordinates = readCoordinates();

    if (!coordinates) {
        return;
    }

    const algorithm =
        document.getElementById('algorithm').value === 'dda'
            ? lineDDA
            : lineBresenham;

    const selected = getPixels(algorithm, coordinates);

    const scale = document.getElementById('zoom').checked
        ? 12
        : 1;

    canvas.width = 50 * scale;
    canvas.height = 50 * scale;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (scale > 1) {
        ctx.fillStyle = '#e4e9f0';

        for (let i = 0; i <= 50; i++) {
            ctx.fillRect(i * scale, 0, 1, canvas.height);
            ctx.fillRect(0, i * scale, canvas.width, 1);
        }
    }

    ctx.fillStyle = '#2456a6';

    const size = scale > 1 ? scale - 1 : 1;

    for (const [x, y] of selected) {
        ctx.fillRect(x * scale, y * scale, size, size);
    }

    document.getElementById('pixels').textContent =
        formatPixels(selected);

    document.getElementById('pixelCount').textContent =
        `Всего: ${selected.length}`;

    rows = [];
    collectSteps = true;

    getPixels(lineBresenham, coordinates);

    collectSteps = false;

    const body = document.getElementById('steps');
    body.replaceChildren();

    for (const row of rows) {
        addRow(body, row);
    }
}

const examples = [
    ['Горизонтальный', [2, 5, 20, 5]],
    ['Вертикальный', [7, 2, 7, 20]],
    ['Пологий', [2, 2, 8, 5]],
    ['Крутой', [3, 2, 7, 25]],
    ['Обратное направление', [8, 5, 2, 2]],
    ['Справа налево', [20, 8, 2, 3]],
    ['Снизу вверх', [5, 20, 15, 2]],
    ['Одна точка', [10, 10, 10, 10]]
];

function compare() {
    const coordinates = readCoordinates();

    if (!coordinates) {
        return;
    }

    const body = document.getElementById('comparisons');
    body.replaceChildren();

    const allExamples = [
        ...examples,
        ['Текущий', coordinates]
    ];

    for (const [name, coords] of allExamples) {
        const dda = getPixels(lineDDA, coords);
        const bres = getPixels(lineBresenham, coords);

        const ddaSet = new Set(
            dda.map(point => point.join(','))
        );

        const bresSet = new Set(
            bres.map(point => point.join(','))
        );

        const onlyDDA = dda.filter(point =>
            !bresSet.has(point.join(','))
        );

        const onlyBres = bres.filter(point =>
            !ddaSet.has(point.join(','))
        );

        const same =
            onlyDDA.length === 0 && onlyBres.length === 0;

        const row = addRow(body, [
            `${name}: (${coords[0]}, ${coords[1]}) → ` +
            `(${coords[2]}, ${coords[3]})`,
            same ? 'Да' : 'Нет',
            formatPixels(onlyDDA) || '—',
            formatPixels(onlyBres) || '—'
        ]);

        const cell = document.createElement('td');
        const details = document.createElement('details');
        const title = document.createElement('summary');
        const text = document.createElement('pre');

        title.textContent = 'Показать';

        text.textContent =
            `ЦДА\n${formatPixels(dda)}\n\n` +
            `Брезенхем\n${formatPixels(bres)}`;

        details.append(title, text);
        cell.appendChild(details);
        row.appendChild(cell);
    }
}

function measure(algorithm, lines) {
    buffer.fill(0);

    const start = performance.now();

    for (const line of lines) {
        algorithm(...line);
    }

    const end = performance.now();

    return end - start;
}

async function benchmark() {
    const button = document.getElementById('benchmark');
    const status = document.getElementById('benchmarkStatus');
    const body = document.getElementById('times');

    button.disabled = true;
    body.replaceChildren();

    document.getElementById('summary').textContent = '';

    const lines = Array.from(
        { length: 10000 },
        () => Array.from(
            { length: 4 },
            () => Math.floor(Math.random() * 50)
        )
    );

    const results = [];

    try {
        status.textContent = 'Прогрев и измерения…';

        await new Promise(resolve => setTimeout(resolve, 0));

        measuring = true;

        measure(lineDDA, lines);
        measure(lineBresenham, lines);

        measuring = false;

        for (let run = 1; run <= 5; run++) {
            await new Promise(resolve => setTimeout(resolve, 0));

            measuring = true;

            const dda = measure(lineDDA, lines);
            const bres = measure(lineBresenham, lines);

            measuring = false;

            results.push([dda, bres]);

            addRow(body, [
                run,
                dda.toFixed(3),
                bres.toFixed(3)
            ]);

            status.textContent =
                `Выполнено запусков: ${run} из 5`;
        }

        const average = index =>
            results.reduce(
                (sum, row) => sum + row[index],
                0
            ) / results.length;

        addRow(body, [
            'Среднее',
            average(0).toFixed(3),
            average(1).toFixed(3)
        ]);

        document.getElementById('summary').textContent =
            'Сравните все запуски и повторите эксперимент. ' +
            'Результаты зависят от браузера, прогрева, ' +
            'фоновой нагрузки и порядка запуска. ' +
            'Измеряется также запись пикселей в буфер. ' +
            'Один эксперимент не доказывает, что алгоритм ' +
            'всегда будет быстрее другого.';
    } finally {
        measuring = false;
        button.disabled = false;
    }
}

document.getElementById('lineForm').addEventListener(
    'submit',
    event => {
        event.preventDefault();
        draw();
    }
);

document.getElementById('zoom').addEventListener(
    'change',
    draw
);

document.getElementById('algorithm').addEventListener(
    'change',
    draw
);

document.getElementById('compare').addEventListener(
    'click',
    compare
);

document.getElementById('benchmark').addEventListener(
    'click',
    benchmark
);

draw();
compare();