import fs from 'fs'
import { grammar } from './grammar.grammar'

async function main(fn: string) {
  const source = fs.readFileSync(fn).toString().trim()
  const res = await grammar.parse(source)
  console.log(res.result)
}

if (require.main === module) {
  main(process.argv[2]).catch(console.error)
}