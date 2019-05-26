const stackRegEx = /at (?![a-z]+:\/\/)(\S+)/g
// const stackRegEx = /at (\S+)/g
function logBegin() {
    let stack = (new Error()).stack.match(stackRegEx);
    let func = stack[1] || stack.pop();
    console.warn(`[BEGIN]${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}
function logEnd() {
    let stack = (new Error()).stack.match(stackRegEx);
    let func = stack[1] || stack.pop();
    console.debug(`[END]${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}
function logBeginSub() {
    let stack = (new Error()).stack.match(stackRegEx);
    let func = stack[1] || stack.pop();
    console.debug(`	{START}${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}
function logEndSub() {
    let stack = (new Error()).stack.match(stackRegEx);
    let func = stack[1] || stack.pop();
    console.debug(`	{FINISH}${func.split(/ |\./).pop()}`, JSON.stringify(arguments));
}

function jsonAddProperty(property, to, from) {
    if (to[property]) {
        to[property] += from[property]
    } else {
        to[property] = from[property];
    }
    return to;
}
function jsonAdd(to, from) {
    for (let prop in from) {
        if (to[prop]) {
            to[prop] += from[prop];
        } else {
            to[prop] = from[prop];
        }
    }
    return to;
}

function minMax(value, min, max) {
    return Math.max( //Value should not be smaller than min
        min,
        Math.min(max, value) //Value should not be larger than max
    );
}

function runAsync(func) {
	window.requestIdleCallback(() => {
		func();
	});
}