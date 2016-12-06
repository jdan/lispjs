## lispjs

Let's compile Lisp into JavaScript using JavaScript

Check out the [unit tests](https://github.com/jdan/lispjs/blob/master/test/index.test.js) for a good idea of how this works.

## Usage

```
$ git clone https://github.com/jdan/lispjs.git
$ cd lispjs
$ npm install
$ cat digits.scm
(define (idiv a b)
    (Math.floor (/ a b)))

(define (digitsHelper q)
    (if (== 0 q)
        []
        (cons (modulo q 10)
              (digitsHelper (idiv q 10)))))

(define (digits n)
    (reverse (digitsHelper n)))

(print (digits 103))
$ node cli.js digits.scm --no-eval
function print() {
    return console.log.apply(console, [].slice.call(arguments))
};function reverse(xs) {
    return xs.slice().reverse()
};function mod(a, b) {
    return a % b
};function cons(x, xs) {
    return [x].concat(xs)
};function eq(a, b) {
    return a === b
};function div() {
    const args = [].slice.call(arguments)
    return args.slice(1).reduce((a, b) => a / b, args[0])
};function idiv(a,b){return Math.floor(div(a,b))};function digitsHelper(q){return (eq(0,q))?([]):(cons(mod(q,10),digitsHelper(idiv(q,10))))};function digits(n){return reverse(digitsHelper(n))};print(digits(103))
$ node cli.js digits.scm
[ 1, 0, 3 ]
```

## Test

```
$ npm test
```
