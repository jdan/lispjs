const assert = require("assert")
const { describe, it } = require("mocha")
const { tokenize, findClosingToken, getSExpressions } = require("../")

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
})
