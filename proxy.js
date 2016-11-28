/**
 * Mechanisms for using built-in lisp functions
 */

function plus() {
    return [].slice.call(arguments).reduce((a, b) => a + b, 0)
}

function sub() {
    return [].slice.call(arguments).reduce((a, b) => a - b, 0)
}

function mult() {
    return [].slice.call(arguments).reduce((a, b) => a * b, 1)
}

function div() {
    return [].slice.call(arguments).reduce((a, b) => a / b, 1)
}

function cons(x, xs) {
    return [x].concat(xs)
}

function car(xs) {
    return xs[0]
}

function cdr(xs) {
    return xs.slice(1)
}

function list() {
    return [].slice.call(arguments)
}

const fnMap = {
    "+": plus,
    "-": sub,
    "*": mult,
    "/": div,

    cons,
    car,
    cdr,
    list,
}

function proxy(name, addPackage) {
    if (fnMap.hasOwnProperty(name)) {
        const fn = fnMap[name]
        if (addPackage) {
            addPackage(fn)
        }
        return fn.name
    }

    return name
}

module.exports = {
    proxy,
}