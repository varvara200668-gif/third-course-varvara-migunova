const values = [];

const input = document.querySelector('#number');
const error = document.querySelector('#error');
const list = document.querySelector('#numbers');

function addValue(value) {
  values.push(value);
  render();
}

function removeLastValue() {
  values.pop();
  render();
}

function clearValues() {
  values.length = 0;
  render();
}

function getStatistics(values) {
  if (values.length === 0) {
    return {
      count: 0,
      sum: 0,
      min: null,
      max: null,
      average: null
    };
  }

  let sum = 0;
  let min = values[0];
  let max = values[0];

  for (const value of values) {
    sum += value;

    if (value < min) {
      min = value;
    }

    if (value > max) {
      max = value;
    }
  }

  return {
    count: values.length,
    sum: sum,
    min: min,
    max: max,
    average: sum / values.length
  };
}

function render() {
  list.textContent = '';
  error.textContent = '';

  for (const value of values) {
    const item = document.createElement('li');
    item.textContent = value;
    list.appendChild(item);
  }

  const statistics = getStatistics(values);

  document.querySelector('#count').textContent = statistics.count;
  document.querySelector('#sum').textContent = statistics.sum;

  if (statistics.count === 0) {
    document.querySelector('#average').textContent = '—';
    document.querySelector('#min').textContent = '—';
    document.querySelector('#max').textContent = '—';
  } else {
    document.querySelector('#average').textContent = statistics.average;
    document.querySelector('#min').textContent = statistics.min;
    document.querySelector('#max').textContent = statistics.max;
  }
}

document.querySelector('#add').addEventListener('click', function () {
  if (input.value.trim() === '') {
    error.textContent = 'Введите число.';
    return;
  }

  const value = Number(input.value);

  if (!Number.isFinite(value)) {
    error.textContent = 'Введите корректное конечное число.';
    return;
  }

  addValue(value);

  input.value = '';
  input.focus();
});

document.querySelector('#remove-last').addEventListener(
  'click',
  removeLastValue
);

document.querySelector('#clear').addEventListener(
  'click',
  clearValues
);

render();