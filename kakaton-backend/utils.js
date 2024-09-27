const { VM } = require('vm2');

/**
 * Выполняет пользовательский код в безопасной среде.
 * @param {string} code - Код пользователя.
 * @param {number} taskIndex - Индекс текущего задания.
 * @returns {object} - Выполненная функция или класс.
 * @throws {Error} - Если код не удалось выполнить.
 */
function executeUserCode(code, taskIndex) {
    const vm = new VM({
        timeout: 1000,
        sandbox: {}
    });

    vm.run(code);

    switch (taskIndex) {
        case 0:
            return vm.run('multiply');
        case 1:
            return vm.run('Car');
        case 2:
            return vm.run('capitalize');
        case 3:
            return vm.run('factorial');
        case 4:
            return vm.run('findMax');
        default:
            throw new Error('Неподдерживаемое задание');
    }
}

/**
 * Проверяет результат выполнения тестового случая.
 * @param {number} taskIndex - Индекс текущего задания.
 * @param {any} result - Результат выполнения функции/класса.
 * @param {any} expected - Ожидаемый результат.
 * @returns {boolean} - Пройден ли тест.
 */
function validateTestResult(taskIndex, result, expected) {
    if (taskIndex === 1) { // Класс Car
        return result.make === expected.make && result.model === expected.model;
    }
    return result === expected;
}

module.exports = {
    executeUserCode,
    validateTestResult,
};
