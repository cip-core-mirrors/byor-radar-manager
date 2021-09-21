const fs = require('fs');
const options = require('./build-files');

for (const file of options.files) {
    fs.renameSync(`${file}.tmp`, file);
}

const buildDir = './build';
for (const file of fs.readdirSync(buildDir)) {
    if (file.endsWith('.tmp')) {
        fs.unlinkSync(`${buildDir}/${file}`)
    }
}