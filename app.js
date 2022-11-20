require('dotenv').config();
const express = require('express');
const { v4: uuid } = require('uuid');
const cors = require('cors');
const { parse } = require('himalaya');
const flat = require('flat');
const { Curl } = require('node-libcurl');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
const terminate = curl.close.bind(curl);

app.get('/html', (req, res) => {
    const url = req.query.url;
    const curl = new Curl();
    curl.setOpt(Curl.option.URL, url);
    curl.on("end", function (statusCode, data, headers) {
        if (statusCode !== 200) res.sendStatus(statusCode);
        try {
            const json = parse(data);
            const flatJson = flat(json);
            var postData = '';
            for (var key in flatJson) {
                if (key.split('.').indexOf('content') >= 0) {
                    const content = flatJson[key].trim();
                    if (content !== ""
                        && !content.includes('{') && !content.includes('}')
                        && !content.includes('[') && !content.includes(']')
                        && !content.includes('<') && !content.includes('</')
                        && !content.includes('>'))
                        postData += flatJson[key].trim() + ' \n';
                }
            }
            this.close();
            res.status(200).send(postData);
        } catch (err) {
            this.close();
            console.error(err);
            res.sendStatus(500);
        }
    });
    curl.on('error', () => terminate);
    curl.perform();
});

app.listen(5454, () => console.log('Posting Service running on port 5454'));