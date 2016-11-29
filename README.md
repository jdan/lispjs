## lispjs

Let's compile Lisp into JavaScript using JavaScript

Check out the [unit tests](https://github.com/jdan/lispjs/blob/master/test/index.test.js) for a good idea of how this works.

## Usage

```
$ git clone https://github.com/jdan/lispjs.git
$ cd lispjs
$ npm install
$ node cli.js --show "(print ((car (list (lambda (a b) (* a b)))) 3 5))"
function mult() {
    return [].slice.call(arguments).reduce((a, b) => a * b, 1)
};function list() {
    return [].slice.call(arguments)
};function car(xs) {
    return xs[0]
};function print() {
    return console.log.apply(console, [].slice.call(arguments))
};print(car(list((function(a,b){return mult(a,b)})))(3,5))
---
15
```

## Test

```
$ npm test
```
