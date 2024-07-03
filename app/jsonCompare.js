const fs = require('fs');
const path = require('path');

const excludeProperties = [
  "_id",
  "_score",
  "@timestamp",
  "@cdate",
  "date_timestamp",
  "date_iso"
];

const loadJSON = (filePath) => {
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(jsonData);
};

const json1 = loadJSON(path.join(__dirname, '..', 'data', 'json1.json'));
const json2 = loadJSON(path.join(__dirname, '..', 'data', 'json2.json'));

const compareJSON = (obj1, obj2, exclude) => {
  const differences = {};

  const compare = (key, value1, value2, result) => {
    if (exclude.includes(key)) return;

    if (value1 === undefined) {
      result[key] = { "Json 1": "field not present", "Json 2": value2 };
    } else if (value2 === undefined) {
      result[key] = { "Json 1": value1, "Json 2": "field not present" };
    } else if (typeof value1 !== typeof value2) {
      result[key] = { "Json 1": value1, "Json 2": value2 };
    } else if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) {
        result[key] = { "Json 1": value1, "Json 2": value2 };
      } else {
        value1.forEach((item, index) => {
          compare(`${key}[${index}]`, item, value2[index], result);
        });
      }
    } else if (typeof value1 === 'object' && value1 !== null && value2 !== null) {
      const subResult = {};
      const keys = new Set([...Object.keys(value1), ...Object.keys(value2)]);
      keys.forEach(subKey => {
        compare(subKey, value1[subKey], value2[subKey], subResult);
      });
      if (Object.keys(subResult).length > 0) {
        result[key] = subResult;
      }
    } else if (value1 !== value2) {
      result[key] = { "Json 1": value1, "Json 2": value2 };
    }
  };

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  allKeys.forEach(key => {
    compare(key, obj1[key], obj2[key], differences);
  });

  return differences;
};

const differences = compareJSON(json1, json2, excludeProperties);

if (Object.keys(differences).length === 0) {
  console.log("The JSONs are identical. No differences found.");
} else {
  const dataDir = path.join(__dirname,'..', 'out');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const filePath = path.join(dataDir, 'jsonDiff.json');
  fs.writeFileSync(filePath, JSON.stringify(differences, null, 2), 'utf-8');

  console.log(`Differences saved to ${filePath}`);
}