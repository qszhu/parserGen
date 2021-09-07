# A Bootstrapping Parser Generator

Based on [parser combinators](https://en.wikipedia.org/wiki/Parser_combinator).

## Requirements
* Node.js v12+

## Setup
```bash
$ npm i
```

## Grammar Rules

Similar to the [notation](https://craftinginterpreters.com/representing-code.html#enhancing-our-notation) used by Robert Nystrom in his [Lox](https://craftinginterpreters.com/appendix-i.html)

* `|` means alternatives
* `?` means "zero or one"
* `*` means "zero to many"
* `+` means "one to many"

Differences:

* syntax rules use `->` to separate head and body
* lexical rules use `:` to separate head and body
* lexical rules use JavaScript `RegExp` instead of natural language, and must start with `^` 


## Example Grammar of a Simple Language
See `grammar/play.grammar`.

```
prog -> (functionDecl | functionCall)* ;

functionDecl -> "function" Identifier "(" ")" functionBody ;

functionBody -> "{" functionCall* "}" ;

functionCall -> Identifier "(" parameterList? ")" ";" ;

parameterList -> StringLiteral ("," StringLiteral)* ;

Identifier : /^[a-zA-Z_][a-zA-Z0-9_]*/ ;

StringLiteral : /^"[^"]*"/ ;
```

Usually the parsing result should be mapped to get sensible intermediate results for further processing. This is done by appending `.map()` calls to rules, which are just plain TypeScript. See `grammar/play.map.grammar`.

## Generate Parser

```bash
# parserGen <grammar>
$ npx ts-node src/parserGen.ts grammar/play.map.grammar > src/play.grammar.ts
```

The heads of the rules are exported as parsers. To use the generated parsers (`src/play.grammar.ts`), just call `.parse()` on source text:

```typescript
// src/play.ts

import { prog } from './play.grammar'

// ...

const res = await prog.parse(source)
console.log(res.result)

// ...
```

Then for a test program (`grammar/play.ts`):

```typescript
/**
 * function call in function body
 */

// foo
function foo(){
  println("in foo...");
}

// bar
function bar(){
  println("in bar...");
  foo();
}

bar();
```

Parse it:

```bash
$ npx ts-node src/play.ts grammar/play.ts 
{ type: 'prog',
  stmts:
   [ { type: 'funcDecl',
       name: 'foo',
       body:
        { type: 'funcBody',
          stmts: [ { type: 'funcCall', name: 'println', params: [ '"in foo..."' ] } ] } },
     { type: 'funcDecl',
       name: 'bar',
       body:
        { type: 'funcBody',
          stmts:
           [ { type: 'funcCall', name: 'println', params: [ '"in bar..."' ] },
             { type: 'funcCall', name: 'foo', params: undefined } ] } },
     { type: 'funcCall', name: 'bar', params: undefined } ] }
```

### Formal Grammar Rules

See `grammar/grammar.grammar`

```
Prologue : /^```.*```/s ;

Regex : /^[/][^].*[/](?=\s*[;\.])/ ;

MapCode : /^\.map\(.*?\)(?=\s*;)/s ;

Terminal : /^[A-Z][A-Za-z_]*/ ;

NonTerminal : /^[a-z][A-Za-z_]*/ ;

Literal : /^"[^"]*"/ ;

primary -> Terminal | NonTerminal | Literal | "(" choice ")" ;

qualified -> primary "?" | primary "*" | primary "+" | primary ;

sequence -> qualified+ ;

choice -> sequence ("|" sequence)* ;

syntax -> NonTerminal "->" choice MapCode? ";" ;

lexical -> Terminal ":" Regex MapCode? ";" ;

grammar -> Prologue? (syntax | lexical)* ;
```

### Bootstrapping
```bash
# generate parser with meta grammar
$ npx ts-node src/parserGen.ts grammar/grammar.grammar > src/grammar1.grammar.ts

# overwrite existing parser with generated parser
$ mv src/grammar1.grammar.ts src/grammar.grammar.ts

# generate a new parser with generated parser
$ npx ts-node src/parserGen.ts grammar/grammar.grammar > src/grammar1.grammar.ts

# compare generated parser with previous parser
$ diff src/grammar.grammar.ts src/grammar1.grammar.ts
# files are the same
```

### Future Improvements
- [ ] Error reporting

### Articles
* [parser combinators 的实现](https://qszhu.github.io/2021/08/22/parser-combinators.html)
* [parser combinators 的使用](https://qszhu.github.io/2021/09/07/parsing-misc.html)