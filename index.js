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
        switch(str[i]) {
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

module.exports = {
    tokenize,
}