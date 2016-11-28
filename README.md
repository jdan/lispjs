## lispjs

Let's compile Lisp into JavaScript using JavaScript

Check out the [unit tests](https://github.com/jdan/lispjs/blob/master/test/index.test.js) for a good idea of how this works.

## Usage

```
$ git clone https://github.com/jdan/lispjs.git
$ cd lispjs
$ npm install
$ node cli.js --show "(console.log (car (cdr (list 1 (* 3 (+ 4 5) 6)))))"
function plus() {
    return [].slice.call(arguments).reduce((a, b) => a + b, 0)
};function mult() {
    return [].slice.call(arguments).reduce((a, b) => a * b, 1)
};function list() {
    return [].slice.call(arguments)
};function cdr(xs) {
    return xs.slice(1)
};function car(xs) {
    return xs[0]
};function print() {
    return console.log.apply(console, [].slice.call(arguments))
};print(car(cdr(list(1,mult(3,plus(4,5),6)))))
---
162
```

## Test

```
$ npm test
```
