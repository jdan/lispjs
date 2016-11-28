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
        assert.deepEqual(getSExpressions("(+ 1 2)"), [
            [
                { type: "word", token: "+", pos: 1 },
                { type: "word", token: "1", pos: 3 },
                { type: "word", token: "2", pos: 5 },
            ],
        ])
    })

    it("should handle nested s-expressions", () => {
        assert.deepEqual(getSExpressions("(+ 1 (+ 2 3) 3)"), [
            [
                { type: "word", token: "+", pos: 1 },
                { type: "word", token: "1", pos: 3 },
                [
                    { type: "word", token: "+", pos: 6 },
                    { type: "word", token: "2", pos: 8 },
                    { type: "word", token: "3", pos: 10 },
                ],
                { type: "word", token: "3", pos: 13 },
            ]
        ])
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
    it("should evaluate single statements", () => {
        assert.deepEqual(parse("1"), {
            type: "Program",
            body: [{
                type: "Statement",
                content: "1",
                pos: 0,
            }],
        })
    })

    it("should evaluate multiple statements", () => {
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

    it("should evaluate function calls", () => {
        assert.deepEqual(parse("(+ 3 4 5)"), {
            type: "Program",
            body: [{
                type: "FunctionExpression",
                name: {
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

    it("should throw for invalid JS output", () => {
        assert.throws(() => {
            evaluate("(nada 1 2 3)")
        }, /Exception in resulting code/)
    })
})