## lispjs

Let's compile Lisp into JavaScript using JavaScript

## Usage

```
$ git clone https://github.com/jdan/lispjs.git
$ cd lispjs
$ npm install
$ node cli.js --show "(console.log (Math.max 1 3 (Math.max 5 10) 8 9))"
console.log(Math.max(1,3,Math.max(5,10),8,9))
---
10
```

## Test

```
$ npm test
```
