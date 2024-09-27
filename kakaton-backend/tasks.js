// tasks.js
const programmingTasks = [
    "Напишите функцию multiply(a, b), которая возвращает произведение двух чисел.",
    "Создайте класс Car с конструктором, принимающим марку и модель.",
    "Напишите функцию capitalize(str), которая возвращает строку с заглавной первой буквой.",
    "Создайте функцию factorial(n), которая возвращает факториал числа.",
    "Напишите функцию findMax(arr), которая возвращает максимальное число в массиве."
];

const solutions = [
    function multiply(a, b) { return a * b; },
    class Car { constructor(make, model) { this.make = make; this.model = model; } },
    function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); },
    function factorial(n) { if (n === 0) return 1; return n * factorial(n - 1); },
    function findMax(arr) { return Math.max(...arr); }
];

const testCases = [
    // multiply(a, b)
    [
        { args: [2, 3], expected: 6 },
        { args: [-1, 5], expected: -5 },
        { args: [0, 10], expected: 0 }
    ],
    // Car class
    [
        { args: ['Toyota', 'Corolla'], expected: { make: 'Toyota', model: 'Corolla' } },
        { args: ['Honda', 'Civic'], expected: { make: 'Honda', model: 'Civic' } }
    ],
    // capitalize(str)
    [
        { args: ['hello'], expected: 'Hello' },
        { args: ['world'], expected: 'World' },
        { args: [''], expected: '' }
    ],
    // factorial(n)
    [
        { args: [0], expected: 1 },
        { args: [5], expected: 120 },
        { args: [3], expected: 6 }
    ],
    // findMax(arr)
    [
        { args: [[1, 2, 3]], expected: 3 },
        { args: [[-1, -2, -3]], expected: -1 },
        { args: [[5, 10, 15]], expected: 15 }
    ]
];

module.exports = {
    programmingTasks,
    solutions,
    testCases,
};
