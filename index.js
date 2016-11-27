function tokenize(str) {
    const tokens = []

    let curr = {
        token: null,
        pos: null,
    }

    function flushCurr() {
        if (curr.token) {
            tokens.push({ type: "word", token: curr.token, pos: curr.pos })
            curr = {
                token: null,
                pos: null,
            }
        }
    }

    function updateCurr(char, pos) {
        if (curr.token) {
            curr.token += char
        } else {
            curr = {
                token: char,
                pos: pos,
            }
        }
    }

    for (let i = 0; i < str.length; i++) {
        switch (str[i]) {
            case "(":
                flushCurr()
                tokens.push({ type: "open", token: str[i], pos: i })
                break
            case ")":
                flushCurr()
                tokens.push({ type: "close", token: str[i], pos: i })
                break
            case "\r":
            case "\n":
            case "\t":
            case " ":
                flushCurr()
                continue
            default:
                updateCurr(str[i], i)
                break
        }
    }

    flushCurr()
    return tokens
}

function findClosingToken(tokens) {
    let depth = 1
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === "open") {
            depth++
        } else if (tokens[i].type === "close") {
            depth--
        }

        if (depth === 0) {
            return i
        }
    }

    return -1
}

function getSExpressions(str) {
    return getSExpressionsTokens(tokenize(str))
}

function getSExpressionsTokens(tokens) {
    const expressions = []

    for (let i = 0; i < tokens.length; i++) {
        switch(tokens[i].type) {
            case "open":
                const closeIndex = findClosingToken(tokens.slice(i + 1))
                if (closeIndex === -1) {
                    throw "Unmatched parenthesis at character " + tokens[i].pos
                }

                expressions.push(
                    getSExpressionsTokens(tokens.slice(i + 1, i + closeIndex + 1)))
                i = i + closeIndex + 1

                break
            default:
                expressions.push(tokens[i])
                break
        }
    }

    return expressions
}

module.exports = {
    tokenize,
    findClosingToken,
    getSExpressions,
}