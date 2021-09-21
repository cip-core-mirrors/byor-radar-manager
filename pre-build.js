require('dotenv').config();
const replace = require('replace-in-file');
const fs = require('fs');

const options =  require('./build-files');

async function replaceAll() {
    try {
        for (const file of options.files) {
            fs.copyFileSync(file, `${file}.tmp`);
        }

        for (const entry of Object.entries(process.env)) {
            if (entry[0].indexOf('REACT_APP_') === 0) {
                options.from = new RegExp(`%${entry[0]}%`, 'g');
                options.to = entry[1];
        
                await replace(options);
            }
        }
    } catch(e) {
        console.error(e);
    }
}

replaceAll();