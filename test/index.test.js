/**
 * Unit tests
 *
 * Protip: Read this from bottom to top to get a decent feel for how the code works.
 */

const assert = require("assert")
const { describe, it } = require("mocha")

const {
    tokenize,
    findClosingToken,
    getSExpressions,
    parse,
    generateCode,
    evaluate,
} = require("../")

describe("tokenizer", () => {
    it("should tokenize characters", () => {
        const tokens = tokenize(`x y z "hello" "world" 1.5`)
        assert.equal(6, tokens.length)
        assert.equal(`"hello"`, tokens[3].token)
    })

    it("should tokenize spaces accordingly", () => {
        const tokens = tokenize(`  x y z
            3     4   5`)
        assert.equal(6, tokens.length)
    })

    it("should keep track of token positions", () => {
        const tokens = tokenize("hello    world")
        assert.equal(0, tokens[0].pos)
        assert.equal(9, tokens[1].pos)
    })

    it("should tokenize parentheses", () => {
        const tokens = tokenize("(+ (* (/ 1 2) 3) 4)")
        assert.equal(13, tokens.length)
        assert.equal(3, tokens.filter(token => token.type === "open").length)
        assert.equal(3, tokens.filter(token => token.type === "close").length)
    })
})

describe("findClosingToken", () => {
    it("should be able to find the token which closes this s-expression", () => {
        assert.equal(3, findClosingToken(tokenize("3 4 5 )")))
        assert.equal(5, findClosingToken(tokenize("3 ( 4 5 ) )")))
        assert.equal(3, findClosingToken(tokenize("3 4 5 ) 5 6")))
    })

    it("should throw -1 if there is no closing token", () => {
        assert.equal(-1, findClosingToken(tokenize("")))
        assert.equal(-1, findClosingToken(tokenize("()")))
        assert.equal(-1, findClosingToken(tokenize("3 (4 5 (5 6))")))
    })
})

describe("s-expression generator", () => {
    it("should generate s-expressions from open and close tokens", () => {
        assert.deepEqual(getSExpressions("(+ 1 2)"), [{
            pos: 0,
            children: [
                { type: "word", token: "+", pos: 1 },
                { type: "word", token: "1", pos: 3 },
                { type: "word", token: "2", pos: 5 },
            ],
        }])
    })

    it("should handle nested s-expressions", () => {
        assert.deepEqual(getSExpressions("(+ 1 (+ 2 3) 3)"), [{
            pos: 0,
            children: [
                { type: "word", token: "+", pos: 1 },
                { type: "word", token: "1", pos: 3 },
                {
                    pos: 5,
                    children: [
                        { type: "word", token: "+", pos: 6 },
                        { type: "word", token: "2", pos: 8 },
                        { type: "word", token: "3", pos: 10 },
                    ],
                },
                { type: "word", token: "3", pos: 13 },
            ],
        }])
    })

    it("should always return an array", () => {
        assert.deepEqual(getSExpressions(""), [])
    })

    it("should fail for invalid s-expressions", () => {
        assert.throws(() => { getSExpressions("(+ 1 2") }, /Unmatched opening/)
        assert.throws(() => { getSExpressions("(+ 1 2()") }, /Unmatched opening/)
        assert.throws(() => { getSExpressions("(+ 1 2))") }, /Unmatched closing/)
    })
})

describe("parser", () => {
    it("should parse single statements", () => {
        assert.deepEqual(parse("1"), {
            type: "Program",
            body: [{
                type: "Statement",
                content: "1",
                pos: 0,
            }],
        })
    })

    it("should parse multiple statements", () => {
        assert.deepEqual(parse(`"hello"\n"world"`), {
            type: "Program",
            body: [
                {
                    type: "Statement",
                    content: `"hello"`,
                    pos: 0,
                },
                {
                    type: "Statement",
                    content: `"world"`,
                    pos: 8,
                },
            ],
        })
    })

    it("should parse function calls", () => {
        assert.deepEqual(parse("(+ 3 4 5)"), {
            type: "Program",
            body: [{
                type: "FunctionExpression",
                function: {
                    type: "Statement",
                    content: "+",
                    pos: 1,
                },
                args: [
                    {
                        type: "Statement",
                        content: "3",
                        pos: 3,
                    },
                    {
                        type: "Statement",
                        content: "4",
                        pos: 5,
                    },
                    {
                        type: "Statement",
                        content: "5",
                        pos: 7,
                    },
                ],
                pos: 0,
            }],
        })
    })

    it("should parse lambda expressions", () => {
        assert.deepEqual(parse("(lambda (x y z) (+ x y z))"), {
            type: "Program",
            body: [{
                type: "LambdaExpression",
                params: [
                    {
                        content: "x",
                        pos: 9,
                    },
                    {
                        content: "y",
                        pos: 11,
                    },
                    {
                        content: "z",
                        pos: 13,
                    },
                ],
                body: {
                    type: "FunctionExpression",
                    function: {
                        type: "Statement",
                        content: "+",
                        pos: 17,
                    },
                    args: [
                        {
                            type: "Statement",
                            content: "x",
                            pos: 19,
                        },
                        {
                            type: "Statement",
                            content: "y",
                            pos: 21,
                        },
                        {
                            type: "Statement",
                            content: "z",
                            pos: 23,
                        },
                    ],
                    pos: 16,
                },
                pos: 0,
            }],
        })
    })

    it("should throw for an invalid number of arguments to lambda", () => {
        assert.throws(() => {
            parse("(lambda)")
        }, /expected 2, was 0/)

        assert.throws(() => {
            parse("(lambda (a b))")
        }, /expected 2, was 1/)
    })

    it("should parse if statements", () => {
        assert.deepEqual(parse("(if true 3 5)"), {
            type: "Program",
            body: [{
                type: "IfStatement",
                pos: 0,
                condition: {
                    type: "Statement",
                    content: "true",
                    pos: 4,
                },
                consequent: {
                    type: "Statement",
                    content: "3",
                    pos: 9,
                },
                alternate: {
                    type: "Statement",
                    content: "5",
                    pos: 11,
                },
            }]
        })
    })

    it("should throw for an invalid number of arguments to if", () => {
        assert.throws(() => {
            parse("(if true 4)")
        }, /expected 3, was 2/)
    })

    it("should parse cond expressions", () => {
        assert.deepEqual(parse("(cond (x 1) (y 2))"), {
            type: "Program",
            body: [{
                type: "CondExpression",
                pos: 0,
                conditions: [
                    {
                        condition: {
                            type: "Statement",
                            content: "x",
                            pos: 7,
                        },
                        consequent: {
                            type: "Statement",
                            content: "1",
                            pos: 9,
                        },
                    },
                    {
                        condition: {
                            type: "Statement",
                            content: "y",
                            pos: 13,
                        },
                        consequent: {
                            type: "Statement",
                            content: "2",
                            pos: 15,
                        },
                    },
                ],
                elseCondition: undefined,
            }]
        })
    })

    it("should parse let expressions", () => {
        assert.deepEqual(parse("(let ((x 1) (y 2)) (+ x y))"), {
            type: "Program",
            body: [{
                type: "LetExpression",
                pos: 0,
                assignments: [
                    {
                        binding: {
                            type: "Statement",
                            content: "x",
                            pos: 7,
                        },
                        value: {
                            type: "Statement",
                            content: "1",
                            pos: 9,
                        }
                    },
                    {
                        binding: {
                            type: "Statement",
                            content: "y",
                            pos: 13,
                        },
                        value: {
                            type: "Statement",
                            content: "2",
                            pos: 15,
                        },
                    },
                ],
                body: {
                    type: "FunctionExpression",
                    pos: 19,
                    function: {
                        type: "Statement",
                        content: "+",
                        pos: 20,
                    },
                    args: [
                        {
                            type: "Statement",
                            content: "x",
                            pos: 22,
                        },
                        {
                            type: "Statement",
                            content: "y",
                            pos: 24,
                        },
                    ],
                },
            }],
        })
    })

    it("should parse variable definitions", () => {
        assert.deepEqual(parse("(define z (* 3 4))"), {
            type: "Program",
            body: [{
                type: "VariableDefinition",
                pos: 0,
                name: {
                    type: "Statement",
                    content: "z",
                    pos: 8,
                },
                body: {
                    type: "FunctionExpression",
                    pos: 10,
                    function: {
                        type: "Statement",
                        content: "*",
                        pos: 11,
                    },
                    args: [
                        {
                            type: "Statement",
                            content: "3",
                            pos: 13,
                        },
                        {
                            type: "Statement",
                            content: "4",
                            pos: 15,
                        },
                    ],
                },
            }],
        })
    })

    it("should parse function definitions", () => {
        assert.deepEqual(parse("(define (add x y) 1 (+ x y))"), {
            type: "Program",
            body: [{
                type: "FunctionDefinition",
                pos: 0,
                name: {
                    type: "Statement",
                    content: "add",
                    pos: 9,
                },
                params: [
                    {
                        type: "Statement",
                        content: "x",
                        pos: 13,
                    },
                    {
                        type: "Statement",
                        content: "y",
                        pos: 15,
                    },
                ],
                proc: [
                    {
                        type: "Statement",
                        content: "1",
                        pos: 18,
                    },
                    {
                        type: "FunctionExpression",
                        pos: 20,
                        function: {
                            type: "Statement",
                            content: "+",
                            pos: 21,
                        },
                        args: [
                            {
                                type: "Statement",
                                content: "x",
                                pos: 23,
                            },
                            {
                                type: "Statement",
                                content: "y",
                                pos: 25,
                            },
                        ],
                    },
                ],
            }],
        })
    })
})

describe("generateCode", () => {
    it("should pipe through simple statements", () => {
        assert.equal(generateCode("10"), "10")
        assert.equal(generateCode("1 2 3"), "1;2;3")
    })

    it("should generate function calls", () => {
        assert.equal(generateCode("(plus 1 2 3)"), "plus(1,2,3)")
    })

    it("should generate anonymous functions", () => {
        assert.equal(generateCode("(lambda (a b) (Math.max a b))"),
            "(function(a,b){return Math.max(a,b)})")
    })

    it("should generate IIFEs for lambdas", () => {
        assert.equal(generateCode("((lambda (a b) (Math.max a b)) 3 5)"),
            "(function(a,b){return Math.max(a,b)})(3,5)")
    })

    it("should generate ternaries for if statements", () => {
        assert.equal(generateCode("(if true 3 5)"), "(true)?(3):(5)")
    })

    it("should generate else-ifs for cond expressions", () => {
        assert.equal(generateCode("(cond (false 7) (true 8))"),
            "(function(){if(false){return 7}else if(true){return 8}})()")

        assert.equal(generateCode("(cond (false 7) (else 8))"),
            "(function(){if(false){return 7}else {return 8}})()")
    })

    it("should generate lets for let expressions", () => {
        assert.equal(generateCode("(let ((x 1)) x)"),
            "(function(){let x=1;return x})()")
    })

    it("should generate consts for variable definitions", () => {
        assert.equal(generateCode("(define x (f 1 2 3))"), "const x=f(1,2,3)")
    })

    it("should generate named functions for function declarations", () => {
        assert.equal(generateCode("(define (f x) (g x 5))"),
            "function f(x){return g(x,5)}")
    })

    it("should handle procedures inside function declarations", () => {
        assert.equal(generateCode("(define (f x) (g x 5) (h x 6))"),
            "function f(x){g(x,5);return h(x,6)}")
    })

    it("should prefix with any necessary packages", () => {
        const code = generateCode("(+ 1 2 3)")
        assert(/function plus/.test(code))
    })
})

describe("evaluate", () => {
    it("should return undefined for empty programs", () => {
        assert.equal(undefined, evaluate(""))
    })

    it("should evaluate simple statements", () => {
        assert.equal(1, evaluate("1"))
    })

    it("should evaluate function calls", () => {
        assert.equal(5, evaluate("(Math.max 3 5 2 1)"))
    })

    it("should evaluate nested function calls", () => {
        assert.equal(29, evaluate("(+ 1 2 (* 4 5) 6)"))
        assert.equal(100, evaluate("(car (list 100 200 300))"))
        assert.deepEqual([100, 4, 5, 6], evaluate("(cons 100 (list 4 5 6))"))
    })

    it("should evaluate lambda expressions", () => {
        assert.equal(14, evaluate("((lambda (a b) (* a b)) 7 2)"))
    })

    it("should evaluate if statements", () => {
        assert.equal(17, evaluate(`
            (if (> 1 2)
                3
                (if (>= 7 7) 17 10))`))
    })

    it("should evaluate cond expressions", () => {
        assert.equal(300, evaluate(`
            (cond ((> 2 3) 100)
                  ((= 4 (Math.max 3 4 5)) 200)
                  ((<= 3 10) (+ 1 299)))
        `))

        assert.equal(300, evaluate(`
            (cond ((> 2 3) 100)
                  ((= 4 (Math.max 3 4 5)) 200)
                  (else (* 3 100)))
        `))
    })

    it("should evaluate let expressions", () => {
        assert.equal(7, evaluate("(let ((x 2) (y 5)) (+ x y))"))
        assert.equal(13, evaluate(`
            (let ((x 3))
                (let ((y 10)) (+ x y)))
        `))

        assert.equal(2500, evaluate(`
            (let ((square (lambda (n) (* n n))))
                (square 50))
        `))
    })

    it("should evaluate variable definitions", () => {
        let result = null
        global.setResult = (x) => {
            result = x
        }

        evaluate(`
            (define f (- 16 7))
            (global.setResult f)
        `)

        assert.equal(result, 9)
    })

    it("should evaluate function definitions", () => {
        let result = null
        global.setResult = (x) => {
            result = x
        }

        evaluate(`
            (define (factorial n)
                (define (inner n acc)
                    (if (== n 0)
                        acc
                        (inner (- n 1) (* acc n))))
                (inner n 1))
            (global.setResult (factorial 6))
        `)

        assert.equal(result, 720)
    })

    it("should throw for invalid JS output", () => {
        assert.throws(() => {
            evaluate("(nada 1 2 3)")
        }, /Exception in resulting code/)
    })
})
