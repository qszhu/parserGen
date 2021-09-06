
import { lazy, oneOf, oneOrMore, Parser, regExp, seqOf, str, zeroOrMore, zeroOrOne } from './parserLib'

const whitespace = regExp(/^\s/)
const ignored = zeroOrMore(whitespace)

const token = (s: string) =>
  seqOf(ignored, str(s))
    .map(([_, res]) => res)

const regexToken = (pattern: RegExp) =>
  seqOf(ignored, regExp(pattern))
    .map(([_, res]) => res)

const Prologue = regexToken(/^```.*```/s)
  .map(res => res.substring(3, res.length - 3))

const Regex = regexToken(/^[/][^].*[/](?=\s*[;\.])/)

const MapCode = regexToken(/^\.map\(.*?\)(?=\s*;)/s)
export const Terminal = regexToken(/^[A-Z][A-Za-z_]*/);

export const NonTerminal = regexToken(/^[a-z][A-Za-z_]*/);

export const Literal = regexToken(/^"[^"]*"/).map(res => `token(${res})`);

export const primary: Parser = lazy(() => oneOf(Terminal, NonTerminal, Literal, seqOf(token("("), choice, token(")")))).map(res => {
    if (Array.isArray(res)) return res[1]
    return res
  });

export const qualified: Parser = lazy(() => oneOf(seqOf(primary, token("?")), seqOf(primary, token("*")), seqOf(primary, token("+")), primary)).map(res => {
    if (Array.isArray(res)) {
      const [primary, quantifier] = res
      if (quantifier === '?') return `zeroOrOne(${primary})`
      if (quantifier === '*') return `zeroOrMore(${primary})`
      if (quantifier === '+') return `oneOrMore(${primary})`
    }
    return res
  });

export const sequence: Parser = lazy(() => oneOrMore(qualified)).map(res => res.length > 1 ? `seqOf(${res.join(', ')})` : res[0]);

export const choice: Parser = lazy(() => seqOf(sequence, zeroOrMore(seqOf(token("|"), sequence)))).map(([first, rest]) => {
    if (Array.isArray(rest) && rest.length > 0) {
      rest = rest.map(r => r[1])
      return `oneOf(${[first, ...rest].join(', ')})`
    }
    return first
  });

export const syntax: Parser = lazy(() => seqOf(NonTerminal, token("->"), choice, zeroOrOne(MapCode), token(";"))).map(([head, _arrow, body, code, _semi]) =>
    `export const ${head}: Parser = lazy(() => ${body})${code || ''};\n`);

export const lexical: Parser = lazy(() => seqOf(Terminal, token(":"), Regex, zeroOrOne(MapCode), token(";"))).map(([head, _arrow, body, code, _semi]) =>
    `export const ${head} = regexToken(${body})${code || ''};\n`);

export const grammar: Parser = lazy(() => seqOf(zeroOrOne(Prologue), zeroOrMore(oneOf(syntax, lexical)))).map(([prologue, rules]) => `${prologue || ''}${rules.join('\n')}`);

