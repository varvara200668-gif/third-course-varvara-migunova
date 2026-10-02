let count = 0;

const plus = document.querySelector('#plus');
const minus = document.querySelector('#minus');
const reset = document.querySelector('#reset');
const output = document.querySelector('#value');
const text = document.querySelector('#text');

function render() {
    output.textContent = count;
    if (count > 0) {
        text.textContent = 'Число положительное';
    } else if (count < 0) {
        text.textContent = 'Число отрицательное';
    } else {
        text.textContent = 'Число равно нулю';
    }
}

plus.addEventListener('click', () => {
    count += 1;
    render();
});

minus.addEventListener('click', () => {
    count -= 1;
    render();
});

reset.addEventListener('click', () => {
    count = 0;
    render();
});

render();
