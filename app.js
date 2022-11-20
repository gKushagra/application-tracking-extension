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
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: __dirname + '/jobHelper.db'
    }
});
knex.schema.createTableIfNotExists("users", function (table) {
    table.uuid("user_id");
    table.string("name");
    table.string("access_code");
    table.string("recovery_email");
    table.string("search_parameters");
}).then(() => {
    knex.schema.createTableIfNotExists("jobs", function (table) {
        table.uuid("job_id");
        table.string("company");
        table.string("title");
        table.timestamp("posted_on");
        table.string("status");
        table.text("description");
        table.jsonb("contacts");
        table.jsonb("todo");
        table.bigInteger("score");
        table.uuid("user_id");
    }).then(() => {
        knex('users')
            .insert({
                user_id: 'd660a52c-17e6-4be0-aea7-c9e490d5301a',
                name: 'test',
                access_code: 'test',
                recovery_email: 'test',
                search_parameters: 'test'
            })
            .then(() => {
                console.info('users table created');
                knex('jobs')
                    .insert({
                        job_id: 'd660a52c-17e6-4be0-aea7-c9e490d5301b',
                        company: 'test',
                        title: 'test',
                        posted_on: knex.fn.now(),
                        status: 'test',
                        description: 'test',
                        contacts: { test: 'test' },
                        todo: { test: 'test' },
                        score: 1,
                        user_id: 'd660a52c-17e6-4be0-aea7-c9e490d5301a'
                    })
                    .then(() => { console.info('jobs table created') });
            });
    });
});

const getAccessCode = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
const checkAccess = (req, res, next) => {
    const userId = req.params.userid;
    knex.select()
        .from('users')
        .where('user_id', '=', userId)
        .then((data) => {
            if (data) next();
            else res.sendStatus(401);
        })
        .catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
}

app.post('/api/v1', async (req, res) => {
    const { name, recoveryEmail, searchParameters } = req.body;
    const userId = uuid();
    const accessCode = getAccessCode(6);
    knex('users')
        .insert({
            user_id: userId,
            name, access_code:
                accessCode,
            recovery_email: recoveryEmail,
            search_parameters: searchParameters
        })
        .then(() => res.status(200).json({ userId, name, accessCode }))
        .catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
});

app.put('/api/v1/:userid', checkAccess, async (req, res) => {
    const { recoveryEmail, searchParameters } = req.body;
    const userId = req.params.userid;
    knex('users')
        .update({
            recovery_email: recoveryEmail,
            search_parameters: searchParameters
        })
        .where('user_id', '=', userId)
        .then(() => res.sendStatus(200))
        .catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
});

app.post('/api/v1/:userid/job', checkAccess, async (req, res) => {
    /**
     * processing logic:
     *  - get search parameters from user_id Q1
     *  - calculate score, where score = (no. of search param matches in descp.) / (total search params)
     *  - insert job Q2
     */
});

app.put('/api/v1/:userid/job/:jobid', checkAccess, async (req, res) => {
    const { company, title, postedOn, status, contacts, todo } = req.body;
    const userId = req.params.userid;
    const jobId = req.params.jobid;
    knex('jobs')
        .update({
            company,
            title,
            posted_on: postedOn,
            status,
            contacts,
            todo
        })
        .where('job_id', '=', jobId)
        .andWhere('user_id', '=', userId)
        .then(() => res.sendStatus(200))
        .catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
});

app.get('/api/v1/:userid/tools/parse', checkAccess, async (req, res) => {
    const url = req.query.url;
    const curl = new Curl();
    const terminate = curl.close.bind(curl);
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