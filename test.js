//
//
// const fs = require('fs');
// const readline = require('readline');
//
// const fileStream = fs.createReadStream('./quizFiles/VenusQuiz.txt');
// const rl = readline.createInterface({
//     input: fileStream,
//     crlfDelay: Infinity
// });
//
// let obj = {};
// obj.questions = [];
// let question = {};
// question["options"] = [];
//
// let newlineEncountered = false;
//
// rl.on('line', (line) => {
//         if (obj.topic) {
//             if (line === "" && question.options.length > 0) {
//                 question.correctOption = question.options.pop().toLowerCase();
//                 obj.questions.push(question);
//                 question={};
//                 question["options"] = [];
//             } else {
//                 if (question.questionString) {
//                     question.options.push(line);
//                 } else {
//                     question.questionString = line;
//                 }
//             }
//         }
//         obj.topic = obj.topic || line;
//     }
// );
//
//
// rl.on('close', () => {
//     console.log('End of file');
//     fs.writeFile('output.txt', JSON.stringify(obj), (err) => {
//         if (err) {
//             console.error(err);
//             return;
//         }
//         console.log('Data has been saved to the file.');
//     });
// });
//
