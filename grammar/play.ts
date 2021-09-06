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