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
    const args = [].slice.call(arguments)
    return args.slice(1).reduce((a, b) => a / b, args[0])
}

function eq(a, b) {
    return a === b
}

function neq(a, b) {
    return a !== b
}

function gt(a, b) {
    return a > b
}

function gte(a, b) {
    return a >= b
}

function lt(a, b) {
    return a < b
}

function lte(a, b) {
    return a <= b
}

function mod(a, b) {
    return a % b
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

function reverse(xs) {
    return xs.slice().reverse()
}

function print() {
    return console.log.apply(console, [].slice.call(arguments))
}

const fnMap = {
    "+": plus,
    "-": sub,
    "*": mult,
    "/": div,
    "%": mod,
    "modulo": mod,

    "=": eq,
    "==": eq,
    "!=": neq,
    ">": gt,
    ">=": gte,
    "<": lt,
    "<=": lte,

    cons,
    car,
    cdr,
    list,
    reverse,
    print,
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