const fs = require("fs")
const { argv } = require("optimist")
const { generateCode, evaluate } = require("./")

function usage() {
    console.log("Usage: ./cli [--output=file] [--no-eval] file")
    process.exit(1)
}

if (!argv._.length) {
    usage()
}

try {
    const inputFile = argv._[0]

    if (!fs.existsSync(inputFile)) {
        console.log("Input file not found.")
        usage()
    }

    fs.readFile(inputFile, "utf-8", (err, contents) => {
        if (err) {
            console.log(err)
            usage()
        }

        const output = generateCode(contents)

        if (argv.output) {
            fs.writeFileSync(argv.output, "utf-8", output)
        }

        if (argv.eval === false) {
            console.log(output)
        } else {
            evaluate(contents)
        }
    })
} catch (e) {
    console.log(e)
    process.exit(1)
}