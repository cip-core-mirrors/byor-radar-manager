const express = require('express');

const app = express();

app.use(express.static('build'));
app.get('*', async function(req, res, next) {
    res.sendFile('index.html', {
        root: './build'
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});