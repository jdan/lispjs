/**
 *  Let's parse some lisp
 */

const assert = require("assert")
const { proxy } = require("./proxy")

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
                    throw "Unmatched opening parenthesis at character " + tokens[i].pos
                }

                expressions.push({
                    pos: tokens[i].pos,
                    children: getSExpressionsTokens(tokens.slice(i + 1, i + closeIndex + 1)),
                })
                i = i + closeIndex + 1

                break

            case "close":
                throw "Unmatched closing parenthesis at character " + tokens[i].pos

            default:
                expressions.push(tokens[i])
                break
        }
    }

    return expressions
}

function parse(str) {
    const expressions = getSExpressions(str)

    return {
        type: "Program",
        body: expressions.map(parseSExpressions),
    }
}

function parseSExpressions(expression) {
    if (expression.children) {
        const { children } = expression
        switch (children[0].token) {
            case "lambda":
                // Assertions about the shape of lambda expressions
                //
                // Namely: the second child (argument list) should be a flat array,
                // and the third child (the body) should be an array
                assert(children.length === 3,
                    `Invalid number of arguments for lambda expression (expected 2, ` +
                    `was ${children.length - 1}) at ${expression.pos}`)
                assert(children[1].children,
                    "Invalid syntax for lambda at character " + children[1].pos)
                assert(children[1].children.every(child => child.type === "word"),
                    "Invalid syntax for lambda at character " + children[1].pos)
                assert(children[2].children,
                    "Invalid syntax for lambda at character " + children[2].pos)

                return {
                    type: "LambdaExpression",
                    params: children[1].children.map(expression => {
                        return {
                            content: expression.token,
                            pos: expression.pos,
                        }
                    }),
                    body: parseSExpressions(children[2]),
                    pos: expression.pos,
                }

            case "if":
                assert(children.length === 4,
                    `Invalid number of arguments for if statements (expected 3, ` +
                    `was ${children.length - 1}) at ${expression.pos}`)

                return {
                    type: "IfStatement",
                    condition: parseSExpressions(children[1]),
                    consequent: parseSExpressions(children[2]),
                    alternate: parseSExpressions(children[3]),
                    pos: expression.pos,
                }

            case "cond":
                // Cond is silly because it has a magic `else` argument
                //
                // TODO: assert `else` is last if it exists at all
                const conditions = children.slice(1)
                    .map(child => {
                        const [condition, consequent] = child.children
                        return {
                            condition: parseSExpressions(condition),
                            consequent: parseSExpressions(consequent),
                        }
                    })

                const last = conditions[conditions.length - 1]
                let elseCondition
                if (last.condition.type === "Statement" &&
                        last.condition.content === "else") {
                    elseCondition = last
                    conditions.pop()
                }

                return {
                    type: "CondExpression",
                    conditions,
                    elseCondition,
                    pos: expression.pos,
                }

            case "let":
            case "let*":
                const assignments = children[1].children.map(assignment => {
                    return {
                        binding: parseSExpressions(assignment.children[0]),
                        value: parseSExpressions(assignment.children[1]),
                    }
                })

                return {
                    type: "LetExpression",
                    assignments,
                    body: parseSExpressions(children[2]),
                    pos: expression.pos,
                }

            case "define":
                if (children[1].children) {
                    const name = parseSExpressions(children[1].children[0])
                    const params = children[1].children.slice(1).map(parseSExpressions)
                    // TODO: body can be multiple statements and we should only
                    // return the last one

                    return {
                        type: "FunctionDefinition",
                        name,
                        params,
                        body: parseSExpressions(children[2]),
                        pos: expression.pos,
                    }
                } else {
                    const name = parseSExpressions(children[1])

                    return {
                        type: "VariableDefinition",
                        name,
                        body: parseSExpressions(children[2]),
                        pos: expression.pos,
                    }
                }

            default:
                return {
                    type: "FunctionExpression",
                    // The first function we are invoking is not necessarily
                    // just a name. It could be any expression which itself
                    // returns a function.
                    //
                    // For example, ((lambda (n) (+ n 2)) 7) is totally valid.
                    function: parseSExpressions(children[0]),
                    args: children.slice(1).map(parseSExpressions),
                    pos: expression.pos,
                }
        }
    } else {
        return {
            type: "Statement",
            content: expression.token,
            pos: expression.pos,
        }
    }
}

function generateCode(str) {
    const packages = {}
    let code = translateAst(parse(str), fn => {
        packages[fn.name] = fn
    })

    // Prefix all necessary packages
    for (let package in packages) {
        if (packages.hasOwnProperty(package)) {
            code = packages[package] + ";" + code
        }
    }

    return code
}

function translateAst(ast, addPackage) {
    switch (ast.type) {
        case "Program":
            return ast.body.map(statement => translateAst(statement, addPackage)).join(";")
        case "FunctionExpression":
            const fn = proxy(translateAst(ast.function, addPackage), addPackage)
            const args = ast.args.map(arg => translateAst(arg, addPackage)).join(",")
            return `${fn}(${args})`
        case "LambdaExpression":
            const params = ast.params.map(param => param.content).join(",")
            const body = translateAst(ast.body, addPackage)
            return `(function(${params}){return ${body}})`
        case "IfStatement":
            const condition = translateAst(ast.condition, addPackage)
            const consequent = translateAst(ast.consequent, addPackage)
            const alternate = translateAst(ast.alternate, addPackage)
            return `(${condition})?(${consequent}):(${alternate})`
        case "CondExpression":
            // We'll translate each condition into an if statement, where the
            // body invokes `return`
            const conditions = ast.conditions.map(child => {
                const condition = translateAst(child.condition, addPackage)
                const consequent = translateAst(child.consequent, addPackage)
                return `if(${condition}){return ${consequent}}`
            })

            // We'll add `else` as a special case
            if (ast.elseCondition) {
                const consequent = translateAst(
                    ast.elseCondition.consequent, addPackage)
                conditions.push(`{return ${consequent}}`)
            }

            // Then we'll join everything with `else` to make `else-if`s, (and
            // a trailing `else`), and wrap it all in a function
            return `(function(){${conditions.join("else ")}})()`
        case "LetExpression":
            const assignments = ast.assignments.map(assignment => {
                const value = translateAst(assignment.value, addPackage)
                return `let ${assignment.binding.content}=${value}`
            }).join(";")

            const letBody = translateAst(ast.body, addPackage)
            return `(function(){${assignments};return ${letBody}})()`
        case "VariableDefinition":
            const vname = translateAst(ast.name, addPackage)
            const vbody = translateAst(ast.body, addPackage)
            return `const ${vname}=${vbody}`
        case "FunctionDefinition":
            const name = translateAst(ast.name, addPackage)
            const fparams = ast.params.map(p => p.content).join(",")
            const fbody = translateAst(ast.body, addPackage)
            return `function ${name}(${fparams}){return ${fbody}}`
        case "Statement":
            return ast.content
    }
}

function evaluate(input) {
    try {
        return eval(generateCode(input))
    } catch (e) {
        throw `Exception in resulting code: ${e.name}: ${e.message}`
    }
}

module.exports = {
    tokenize,
    findClosingToken,
    getSExpressions,
    parse,
    generateCode,
    evaluate,
}
