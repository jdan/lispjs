const { evaluate } = require("./")

if (process.argv.length < 3) {
    console.log("Enter some code")
    process.exit(1)
} else {
    evaluate(process.argv[2])
}