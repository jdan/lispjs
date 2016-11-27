const { generateCode, parse, evaluate } = require("./")

let showCode = false
const showIndex = process.argv.findIndex(arg => arg === "--show")
if (showIndex > -1) {
    showCode = true
    process.argv.splice(showIndex, 1)
}

if (process.argv.length < 3) {
    console.log("Usage: ./cli [--show] code")
    process.exit(1)
} else {
    try {
        const input = process.argv[2]
        if (showCode) {
            console.log(generateCode(parse(input)))
            console.log("\n---\n")
        }

        evaluate(input)
    } catch (e) {
        console.log(e)
    }
}