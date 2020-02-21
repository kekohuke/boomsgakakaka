const use = require('@tensorflow-models/universal-sentence-encoder');
const math = require('mathjs');
const XLSX = require("xlsx");
var workbook = XLSX.readFile("chat_data.xlsx");
var obj = workbook.Sheets["Connecting to Congress Chat Dat"];
const util = require('util')
const threshold = 0.8;
const useLoad = use.load(); // Load the model.

function load_csv() {
    const keys = Object.keys(obj);
    let q = "";
    const arr = [];
    for (let i = 0; i < keys.length; i++) {
        if (obj[keys[i]].v === "Question") {
            q = keys[i][0];
        }
        else if (q !== "" && keys[i][0] === q) {
            arr.push(obj[keys[i]].v);
        }
    }
    return arr;
}

async function USE_generater(sentence) {
    let data = [];
    await useLoad.then(async model => {
        // Embed an array of sentences. 
        await model.embed(sentence).then(async embeddings => { 
            // `embeddings` is a 2D tensor consisting of the 512-dimensional embeddings for each sentence. 
            // So in this example `embeddings` has the shape [2, 512]. 
            data = await embeddings.arraySync();
        });
    });
    return data[0];
}

function USE_new_generater(sentence) {
    return new Promise( function(resolve) {
        let data = [];
        useLoad
            .then( model => {
                // Embed an array of sentences. 
                model.embed(sentence).then( embeddings => { 
                    // `embeddings` is a 2D tensor consisting of the 512-dimensional embeddings for each sentence. 
                    // So in this example `embeddings` has the shape [2, 512]. 
                    data = embeddings.arraySync();
                    resolve(data[0]);
                });
            });
    });
}

function sum( obj ) {
    var sum = 0;
    for( var el in obj ) {
        if( obj.hasOwnProperty( el ) ) {
            sum += parseFloat( obj[el] );
        }
    }
    return sum;
}

const sentences = load_csv();
const dataset = [];
const cluster = [];
let sentence_counter = 0;
let cluster_counter = 0;
let weight_temp = 0;
let inserted = false;
function Usethis(){
    return USE_new_generater('I have a pen');
}
console.log(Usethis())
/*
sentences.forEach(async sentence_string => { // simulate question input one-by-one
    let temp = await USE_generater(sentence_string); // return USE value
    if (cluster.length == 0) { // if cluster is empty, create a cluster and insert first sentence.
        console.log('Creating a new cluster.');
        var sentence = {};
        sentence['string'] = sentence_string;
        sentence['id'] = sentence_counter.toString();
        sentence['value'] = temp;
        sentence['weight'] = 0;
        sentence['detail'] = {}
        cluster_counter += 1;
        sentence_counter += 1;
        cluster.push(sentence);
        dataset.push(cluster);
        console.log(dataset);
    } else { // else there is at least one cluster, compare with it to determine next step
        console.log('Adding a new sentence to a cluster.');
        inserted = false;
        for (i = 0; i < dataset.length && inserted === false; i++) { // for each cluster, check with leader sentence
            weight_temp = math.dot(dataset[i][0]['value'],temp);
            //console.log(weight_temp);
            if (weight_temp > threshold) { // if weight_temp over 0.5, suppose they are similar
                inserted = true;
                //console.log('inside')
                var sentence = {};
                // insert a sentence
                sentence['string'] = sentence_string;
                sentence['id'] = sentence_counter.toString();
                sentence['value'] = temp;
                for (j = 0; j < dataset[i].length; j++) { // assign value to weight detail, for each sentence in same cluster, do this once
                    // console.log('Here is what i want to see ' + i + j);
                    // console.log(dataset[i][j]['id']);
                    // console.log(math.dot(dataset[i][j]['value'],temp));
                    foreign_id = dataset[i][j]['id']
                    try{
                        sentence['detail'][foreign_id] = math.dot(dataset[i][j]['value'],temp);
                    }catch(e){
                        sentence['detail'] = { [foreign_id]: math.dot(dataset[i][j]['value'],temp)};
                    }
                    try{
                        dataset[i][j]['detail'][sentence_counter] = math.dot(dataset[i][j]['value'],temp);
                    }catch(e){
                        dataset[i][j]['detail'] =  {[sentence_counter]: math.dot(dataset[i][j]['value'],temp)};
                    }
                    dataset[i][j]['weight'] =  sum(dataset[i][j]['detail']);
                    // console.log('The inserted sentence detail currrently is:')
                    // console.log(sentence['detail'])
                    // console.log('and the related sentence detail is:')
                    // console.log(dataset[i][j]['detail'])
                }
                sentence['weight'] = sum(sentence['detail']);
                sentence_counter += 1;
                dataset[i].push(sentence);
                dataset[i].sort(function(first,second){
                    return second["weight"] - first["weight"];
                })
                //console.log(dataset)
            } // else they are not similar, go to next cluster
            //console.log('outside')
            // create a new cluster
        }
        if (inserted === false) {
            inserted = true;
            const temp_cluster = [];
            var sentence = {};
            sentence['string'] = sentence_string;
            sentence['id'] = sentence_counter.toString();
            sentence['value'] = temp;
            sentence['weight'] = 0;
            sentence['detail'] = {}
            cluster_counter += 1;
            sentence_counter += 1;
            temp_cluster.push(sentence);
            dataset.push(temp_cluster);
            //console.log(dataset);
        }
    }
    console.log('This is final dataset.');
    //console.log(dataset);
    console.log(util.inspect(dataset, { maxArrayLength: null }))
    /*
    for (i = 0; i < dataset.length; i++) {
        if (dataset[i][0].weight !== 0)
            console.log(dataset[i]);
    }
});*/
// console.log(cluster);