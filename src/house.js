/*
 * House Bonds rendering.
 * A house shows a number bond: the roof (triangle) is the total, and the
 * two windows in the house body are the parts – one is given, one is missing.
 * e.g. roof 7, windows [3, ?]  →  the kid finds 4.
 */
function buildHouseBond(equation) {
    const house = document.createElement('div');
    house.classList.add('house-bond');

    const roof = document.createElement('div');
    roof.classList.add('house-roof');
    const roofNum = document.createElement('span');
    roofNum.textContent = equation.bond.target;
    roof.appendChild(roofNum);

    const body = document.createElement('div');
    body.classList.add('house-body');

    const knownWindow = document.createElement('span');
    knownWindow.classList.add('house-num');
    knownWindow.textContent = equation.bond.a;

    const mysteryWindow = document.createElement('span');
    mysteryWindow.classList.add('house-num', 'mystery');
    mysteryWindow.textContent = '?';

    // Use the side decided at question-generation time.
    if (equation.bond.mysteryLeft) {
        body.append(mysteryWindow, knownWindow);
    } else {
        body.append(knownWindow, mysteryWindow);
    }
    house.append(roof, body);
    return house;
}
