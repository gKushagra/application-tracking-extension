require('dotenv').config();
const express = require('express');
const { v4: uuid } = require('uuid');
const https = require('https');
const cors = require('cors');
const { parse } = require('himalaya');
const flat = require('flat');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get('/html', (req, res) => {
    const url = req.query.url;
    console.log(`fetching url: ` + url);
    let request = https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Did not get an OK from the server. Code: ${response.statusCode}`);
            response.resume();
            return;
        }

        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('close', () => {
            console.log('Retrieved all data');
            try {
                const json = parse(data);
                const flatJson = flat(json);
                var postData = '';
                for (var key in flatJson) {
                    if (key.split('.').indexOf('content') >= 0) {
                        const content = flatJson[key].trim();
                        if (content !== ""
                            && !content.includes('{') && !content.includes('}')
                            && !content.includes('[') && !content.includes(']'))
                            postData += flatJson[key].trim() + ' \n';
                    }
                }
                return res.status(200).send(postData);
            } catch (err) {
                console.error(err);
                return res.sendStatus(500);
            }
        });
    });

});

app.listen(5454, () => console.log('Posting Service running on port 5454'));