type ParserState = {
  target: string
  index: number
  result?: unknown
}

type ParserFn = (state: ParserState) => Promise<ParserState>

export class Parser {
  constructor(readonly parserFn: ParserFn) {}

  async parse(target: string) {
    const initialState: ParserState = {
      target,
      index: 0,
    }
    const nextState = await this.parserFn(initialState)

    if (nextState.index !== target.length) {
      // throw `Parsing end at ${nextState.index}: "${peek(nextState)}"`
    }
    return nextState
  }

  map(fn: (arg: any) => unknown) {
    return new Parser(async (state) => {
      const nextState = await this.parserFn(state)
      return { ...nextState, result: fn(nextState.result) }
    })
  }
}

function peek(state: ParserState) {
  const { target, index } = state
  return target.slice(index, index + 30)
}

export const str = (s: string) =>
  new Parser(async (state: ParserState) => {
    const { target, index } = state
    const slicedTarget = target.slice(index)

    if (slicedTarget.length === 0) {
      throw `str: Tried to match "${s}", but got unexpected EOF.`
    }

    if (slicedTarget.startsWith(s)) {
      return { ...state, index: index + s.length, result: s }
    }

    throw `str: Tried to match "${s}", but got "${peek(state)}" at index ${index}`
  })

export const regExp = (pattern: RegExp) =>
  new Parser(async (state: ParserState) => {
    console.assert(pattern.source.startsWith('^'), 'regExp should start with "^"')

    const { target, index } = state

    const slicedTarget = target.slice(index)
    if (slicedTarget.length === 0) {
      throw `regExp: Tried to match "${pattern}", but got unexpected EOF.`
    }

    const match = slicedTarget.match(pattern)
    if (match) {
      const [result] = match
      return { ...state, index: index + result.length, result }
    }

    throw `regExp: Tried to match "${pattern}", but got "${peek(state)}" at index ${index}`
  })

export const zeroOrMore = (parser: Parser) =>
  new Parser(async (state: ParserState) => {
    const results = []
    let nextState = state

    try {
      while (true) {
        nextState = await parser.parserFn(nextState)
        results.push(nextState.result)
      }
    } catch (e) {}

    return { ...nextState, result: results }
  })

export const zeroOrOne = (parser: Parser) =>
  new Parser(async (state: ParserState) => {
    try {
      const nextState = await parser.parserFn(state)
      return { ...nextState, result: nextState.result }
    } catch (e) {}

    return { ...state, result: undefined }
  })

export const oneOrMore = (parser: Parser) =>
  new Parser(async (state: ParserState) => {
    const results = []
    let nextState = state

    try {
      while (true) {
        nextState = await parser.parserFn(nextState)
        results.push(nextState.result)
      }
    } catch (e) {}

    if (results.length < 1)
      throw `oneOrMore: Unable to match parser at index ${state.index}: "${peek(state)}`

    return { ...nextState, result: results }
  })

export const oneOf = (...parsers: Parser[]) =>
  new Parser(async (state: ParserState) => {
    for (const parser of parsers) {
      try {
        return await parser.parserFn(state)
      } catch (e) {}
    }
    throw `oneOf: Unable to match any parser at index ${state.index}: "${peek(state)}"`
  })

export const seqOf = (...parsers: Parser[]) =>
  new Parser(async (state: ParserState) => {
    const results = []
    let nextState = state

    for (const parser of parsers) {
      nextState = await parser.parserFn(nextState)
      results.push(nextState.result)
    }

    return { ...nextState, result: results }
  })

export const lazy = (thunk: () => Parser) =>
  new Parser((state: ParserState) => {
    const parser = thunk()
    return parser.parserFn(state)
  })
