const assert = require("assert")
const { describe, it } = require("mocha")
const { tokenize } = require("../")

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