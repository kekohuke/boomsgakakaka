const toxicity = require("@tensorflow-models/toxicity");

const XLSX = require("xlsx");
var workbook = XLSX.readFile("chat_data.xlsx");
var obj = workbook.Sheets["Connecting to Congress Chat Dat"];

function range_add_cell(range, cell) {
	var rng = XLSX.utils.decode_range(range);
	var c = typeof cell == 'string' ? XLSX.utils.decode_cell(cell) : cell;
	//console.log(rng, c);
	if(rng.s.r > c.r) rng.s.r = c.r;
	if(rng.s.c > c.c) rng.s.c = c.c;

	if(rng.e.r < c.r) rng.e.r = c.r;
	if(rng.e.c < c.c) rng.e.c = c.c;
	return XLSX.utils.encode_range(rng);
}

function add_to_sheet(sheet, cell) {
	sheet['!ref'] = range_add_cell(sheet['!ref'], cell);
}

function add_a_cell(pos, value) {
    if (!obj[pos]){
        obj[pos] = {};
        add_to_sheet(obj, pos);
    }
    obj[pos].t = "s";
    obj[pos].v = value;
}

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
add_a_cell("G1", "identity_attack")
add_a_cell("H1", "insult")
add_a_cell("I1", "obscene")
add_a_cell("J1", "severe_toxicity")
add_a_cell("K1", "sexual_explicit")
add_a_cell("L1", "threat")
add_a_cell("M1", "toxicity")
console.log(arr);
// The minimum prediction confidence.
const threshold = 0.9;

head_list = ["G", "H", "I", "J", "K", "L", "M"]

toxicity.load(threshold).then( model => {
    var count = 1;
    arr.forEach( sentences => {
        model.classify(sentences).then( predictions => {
            // `predictions` is an array of objects, one for each prediction head,
            // that contains the raw probabilities for each input along with the
            // final prediction in `match` (either `true` or `false`).
            // If neither prediction exceeds the threshold, `match` is `null`.
            console.log(sentences);
            count++;
            for (let i = 0; i < predictions.length; i++) {
                // console.log(predictions[i].results[0])
                add_a_cell(head_list[i]+count, predictions[i].results[0]['match']);
                XLSX.writeFile(workbook, "chat_data.xlsx");
            }
        });
    });
});