const toxicity = require('@tensorflow-models/toxicity');

const XLSX = require('xlsx');
var workbook = XLSX.readFile('chat_data.xlsx');
const obj = workbook.Sheets['Connecting to Congress Chat Dat']


const keys = Object.keys(obj)
let q  = '';
const arr = []

for(let i = 0; i < keys.length; i++){
  if(obj[keys[i]].v === 'Question'){
    q = keys[i][0]
  }
  if(q !== '' && keys[i][0] === q){
    arr.push(obj[keys[i]].v)
  }
}
// The minimum prediction confidence.
const threshold = 0.9;


toxicity.load(threshold).then(model => {
  console.log("in toxic load")
  arr.forEach(sentences =>{
    model.classify(sentences).then(predictions => {
      // `predictions` is an array of objects, one for each prediction head,
      // that contains the raw probabilities for each input along with the
      // final prediction in `match` (either `true` or `false`).
      // If neither prediction exceeds the threshold, `match` is `null`.
      console.log()
      //console.log(predictions[0].results[0])
      let flag = false;
      for(let i = 0; i < predictions.length; i++){
        
        if(predictions[i].results[0].match === true){
          if(flag === false)
            console.log(sentences)
          flag = true;
          console.log(predictions[i].label)
        }
      }
      /*
      prints:
      {
        "label": "identity_attack",
        "results": [{
          "probabilities": [0.9659664034843445, 0.03403361141681671],
          "match": false
        }]
      },
      {
        "label": "insult",
        "results": [{
          "probabilities": [0.08124706149101257, 0.9187529683113098],
          "match": true
        }]
      },
      ...
       */
    });
  })
});
