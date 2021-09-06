### Requirements
* Node.js v12+

### Setup
```bash
$ npm i
```

### Run
```bash
$ npx ts-node src/parserGen.ts grammar/play.map.grammar > src/play.grammar.ts

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

### Bootstrapping
```bash
$ npx ts-node src/parserGen.ts grammar/grammar.grammar > src/grammar1.grammar.ts

$ mv src/grammar1.grammar.ts src/grammar.grammar.ts

$ npx ts-node src/parserGen.ts grammar/grammar.grammar > src/grammar1.grammar.ts

$ diff src/grammar.grammar.ts src/grammar1.grammar.ts
(files are the same)
```
