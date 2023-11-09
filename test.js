
const arr = ["apple","babe","cat","doge","meow"];
function test(val){
    const asciiVal = val.toLowerCase().charCodeAt(0);
    const max = (96+arr.length);
    return asciiVal>=97 && asciiVal<=max;
}

console.log(test('9'));
console.log(test('A'));
console.log(test('a'));
console.log(test('B'));
console.log(test('b'));
console.log(test('C'));
console.log(test('d'));
console.log(test('e'));
console.log(test('F'));