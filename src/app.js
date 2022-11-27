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
app.use(express.static('www'));
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
        table.string('link');
        table.string("company");
        table.string("title");
        table.timestamp("posted_on");
        table.string("status");
        table.text("description");
        table.jsonb("contacts");
        table.jsonb("todo");
        table.bigInteger("score");
        table.uuid("user_id");
        table.text("resume");
        table.text("hash");
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
                        link: 'test',
                        company: 'test',
                        title: 'test',
                        posted_on: knex.fn.now(),
                        status: 'test',
                        description: 'test',
                        contacts: { test: 'test' },
                        todo: { test: 'test' },
                        score: 1,
                        user_id: 'd660a52c-17e6-4be0-aea7-c9e490d5301a',
                        resume: 'test',
                        hash: 'test'
                    })
                    .then(() => { console.info('jobs table created') });
            });
    });
});
// knex.schema.dropTableIfExists('users')
//     .then(() => {
//         knex.schema.dropTableIfExists('jobs')
//             .then(() => {

//             })
//             .catch((err) => console.log(err));
//     })
//     .catch((err) => console.log(err));

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

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/www/index.html');
});

app.post('/api/v1/login', async (req, res) => {
    const { accessCode } = req.body;
    knex('users')
        .select()
        .where('access_code', '=', accessCode)
        .then((data) => {
            if (data.length === 1 && data[0]['access_code'] === accessCode) {
                res.status(200).json({ userId: data[0]['user_id'] });
            } else {
                res.sendStatus(401);
            }
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.post('/api/v1/:userid/verify', async (req, res) => {
    const { accessCode } = req.body;
    const userId = req.params.userid;
    knex('users')
        .select()
        .where('user_id', '=', userId)
        .andWhere('access_code', '=', accessCode)
        .then((data) => {
            if (data.length === 1 && data[0]['access_code'] === accessCode) res.sendStatus(200)
            else res.sendStatus(401)
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.post('/api/v1', async (req, res) => {
    const { name, recoveryEmail } = req.body;
    const userId = uuid();
    const accessCode = getAccessCode(6);
    knex('users')
        .insert({
            user_id: userId,
            name,
            access_code: accessCode,
            recovery_email: recoveryEmail,
            search_parameters: ''
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

app.get('/api/v1/:userid/jobs/check', checkAccess, async (req, res) => {
    const userId = req.params.userid;
    const hash = req.query.hash;
    knex('jobs')
        .select('job_id', 'status', 'score')
        .where('hash', '=', hash)
        .then((data) => res.status(200).json(data))
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.get('/api/v1/:userid/jobs', checkAccess, async (req, res) => {
    const userId = req.params.userid;
    // const offset = req.query.offset;
    // const limit = req.query.limit;
    knex('jobs')
        .select('company', 'job_id', 'link', 'posted_on', 'status', 'title')
        .where('user_id', '=', userId)
        // .offset(offset)
        // .limit(limit)
        .then((data) => res.status(200).json(data))
        .catch((error) => {
            console.log(error);
            res.sendStatus(500);
        });
});

app.post('/api/v1/:userid/jobs', checkAccess, async (req, res) => {
    const { company, link, title, status, description, contacts, todo, hash } = req.body;
    const userId = req.params.userid;
    const jobId = uuid();
    const postedOn = new Date().toUTCString();
    var score = 0;
    knex('users')
        .select('search_parameters')
        .where('user_id', '=', userId)
        .then((data) => {
            if (data.length > 0 && data[0]['search_parameters'] !== '') {
                const searchParameters = data[0]['search_parameters'].split(',');
                if (searchParameters.length > 0) {
                    var counter = 0;
                    for (var i = 0; i < searchParameters.length; i++) {
                        var regex = new RegExp(searchParameters[i], "gi");
                        counter = (description.match(regex) || []).length > 0 ? (counter + 1) : counter;
                    }
                    score = counter / searchParameters.length;
                }
            }
            knex('jobs')
                .insert({
                    job_id: jobId,
                    link,
                    company,
                    title,
                    posted_on: postedOn,
                    status,
                    description,
                    contacts,
                    todo,
                    score,
                    user_id: userId,
                    hash
                })
                .then(() => res.status(200).json({ status, score }))
                .catch(error => {
                    console.log(error);
                    res.sendStatus(500);
                });
        })
        .catch(error => {
            console.log(error);
            res.sendStatus(500);
        });
});

app.put('/api/v1/:userid/jobs/:jobid', checkAccess, async (req, res) => {
    // const { company, title, postedOn, status, contacts, todo, resume } = req.body;
    const { status } = req.body;
    const jobId = req.params.jobid;
    knex('jobs')
        .update({
            status: status
        })
        .where('job_id', '=', jobId)
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

module.exports = app;