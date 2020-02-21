const use = require('@tensorflow-models/universal-sentence-encoder');
const toxicity = require('@tensorflow-models/toxicity');
const math = require('mathjs');
const XLSX = require("xlsx");
var workbook = XLSX.readFile("chat_data_copy.xlsx");
var obj = workbook.Sheets["Connecting to Congress Chat Dat"];
const util = require('util')
const threshold = 0.5;
const useLoad = use.load(); // Load the model.
const toxicityLoad = toxicity.load(); // Load the model.

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

function USE_new_generater(question) {
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

function createCluster(cluster){
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
    return cluster;
}

class dataset{
    constructor(){
        this.cluster = []
        this.dataset = [];
        this.sentence_counter = 0
        this.cluster_counter = 0;
        this.weight_temp = 0;
        this.inserted = false;
        this.threshold = 0.5
    }

    createCluster(sentence_string,temp){
        console.log('Creating a new cluster.');
        var sentence = {
            string: sentence_string,
            id: this.sentence_counter.toString(),
            value: temp,
            weight: 0,
            detail: {}
        };
        this.cluster_counter += 1;
        this.sentence_counter += 1;
        this.cluster.push(sentence);
    }

    getClusterLength(){
        return this.cluster.length;
    }
    getDatasetLength(){
        return this.dataset.length;
    }

    async nextStep(sentence_string,temp){
        console.log('Adding a new sentence to a cluster.');
        this.inserted = false;
        for (let i = 0; i < this.getDatasetLength && this.inserted === false; i++) { // for each cluster, check with leader sentence
            this.weight_temp = math.dot(this.dataset[i][0]['value'],temp);
            if (this.weight_temp > this.threshold) { // if weight_temp over 0.5, suppose they are similar
                this.inserted = true;
                var sentence = {};
                sentence['string'] = this.sentence_string;
                sentence['id'] = this.sentence_counter.toString();
                sentence['value'] = this.temp;
                for (j = 0; j < this.dataset[i].length; j++) { // assign value to weight detail, for each sentence in same cluster, do this once

                    let foreign_id = dataset[i][j]['id']
                    try{
                        sentence['detail'][foreign_id] = math.dot(this.dataset[i][j]['value'],temp);
                    }catch(e){
                        sentence['detail'] = { [foreign_id]: math.dot(this.dataset[i][j]['value'],temp)};
                    }
                    try{
                        this.dataset[i][j]['detail'][this.sentence_counter] = math.dot(this.dataset[i][j]['value'],temp);
                    }catch(e){
                        this.dataset[i][j]['detail'] =  {[this.sentence_counter]: math.dot(this.dataset[i][j]['value'],temp)};
                    }
                    this.dataset[i][j]['weight'] =  sum(this.dataset[i][j]['detail']);
                }
                sentence['weight'] = sum(sentence['detail']);
                this.sentence_counter += 1;
                this.dataset[i].push(sentence);
                this.dataset[i].sort(function(first,second){
                    return second["weight"] - first["weight"];
                })
            } 
        }
        if (this.inserted === false) {
            this.inserted = true;
            this.createCluster(sentence_string,temp)
        }
    }

}
const sentences = load_csv();
let sentence_counter = 0;

const Dataset = new dataset()
sentences.forEach(async sentence_string => { // simulate question input one-by-one
    let temp = await USE_generater(sentence_string);// return USE value
    if (Dataset.getClusterLength == 0) { // if cluster is empty, create a cluster and insert first sentence.
        Dataset.createCluster(sentence_string,temp)
    } else { // else there is at least one cluster, compare with it to determine next step
        Dataset.nextStep(sentence_string,temp)
    }
    console.log('This is final dataset.');
    //console.log(dataset);
    console.log(util.inspect(Dataset.dataset, { maxArrayLength: null }))

});
// console.log(cluster);