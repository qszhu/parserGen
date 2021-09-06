import fs from 'fs'
import { inspect } from 'util'
import { prog } from './play.grammar'

inspect.defaultOptions.colors = true
inspect.defaultOptions.compact = true
inspect.defaultOptions.depth = null

async function main(fn: string) {
  const source = fs.readFileSync(fn).toString().trim()
  const res = await prog.parse(source)
  console.log(inspect(res.result))
}

if (require.main === module) {
  main(process.argv[2]).catch(console.error)
}