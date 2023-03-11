(() => {
    const registerBoxEL = document.getElementById('root-100'),
        registerNameEL = document.getElementById('root-101'),
        registerEmailEl = document.getElementById('root-102'),
        registerButtonEl = document.getElementById('root-103'),
        jobBoxEl = document.getElementById('root-200'),
        jobCompanyEl = document.getElementById('root-201'),
        jobTitleEl = document.getElementById('root-202'),
        // jobStatusEl = document.getElementById('root-203'),
        jobSaveButtonEl = document.getElementById('root-204'),
        viewBoxEL = document.getElementById('root-300'),
        viewBoxItem1El = document.getElementById('root-301'),
        viewBoxItem1LabelEl = document.getElementById('root-3010'),
        viewBoxItem1TextEl = document.getElementById('root-3011'),
        viewBoxItem2El = document.getElementById('root-302'),
        viewBoxItem2LabelEl = document.getElementById('root-3020'),
        viewBoxItem2TextEl = document.getElementById('root-3021'),
        apiUrl = 'https://jobsapi.softwright.in/api/v1';

    registerBoxEL.style.display = 'none';
    jobBoxEl.style.display = 'none';
    viewBoxEL.style.display = 'none';

    chrome.storage.local.get(['userId', 'accessCode'], function (items) {
        if (('userId' in items) && ('accessCode' in items)) {
            fetch(apiUrl + `/${items['userId']}/verify`,
                {
                    method: 'post',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ accessCode: items['accessCode'] })
                })
                .then(res => {
                    if (res.status === 200) loadView(items['userId']);
                    else loadRegister();
                })
                .catch(err => console.error(err));
        } else {
            loadRegister();
        }
    });

    const loadRegister = () => {
        registerBoxEL.style.display = 'flex';
        registerButtonEl.addEventListener('click', () => {
            if (registerNameEL.value && registerNameEL.value != ''
                && registerEmailEl.value && registerEmailEl.value != '') {
                fetch(apiUrl,
                    {
                        method: 'post',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: registerNameEL.value,
                            recoveryEmail: registerEmailEl.value
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data) {
                            chrome.storage.local.set(data, function () {
                                registerBoxEL.style.display = 'none';
                                loadView(data['userId']);
                            });
                        }
                    })
                    .catch(err => console.error(err));
            }
        });
    }
    const loadView = (userId) => {
        viewBoxEL.style.display = 'flex';
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            const hash = tab.url.hashCode();
            fetch(apiUrl + `/${userId}/jobs/check?hash=${hash}`,
                {
                    method: 'get',
                    mode: 'cors'
                })
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        viewBoxItem1TextEl.innerText = data[0]['status'];
                        viewBoxItem2TextEl.innerText = data[0]['score'];
                    } else {
                        viewBoxEL.style.display = 'none';
                        loadForm(tab.url, hash, userId);
                    }
                })
                .catch(err => console.error(err));
        });
    }
    const loadForm = (link, hash, userId) => {
        jobBoxEl.style.display = 'flex';
        jobSaveButtonEl.addEventListener('click', () => {
            if (hash && userId &&
                jobCompanyEl.value && jobCompanyEl.value !== '' &&
                jobTitleEl.value && jobTitleEl.value !== '') {
                fetch(apiUrl + `/${userId}/tools/parse?url=${link}`, {
                    method: 'get',
                    mode: 'cors'
                })
                    .then((res) => res.text())
                    .then((text) => {
                        fetch(apiUrl + `/${userId}/jobs`,
                            {
                                method: 'post',
                                mode: 'cors',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    company: jobCompanyEl.value,
                                    link,
                                    title: jobTitleEl.value,
                                    status: 'shortlisted',
                                    description: text,
                                    contacts: JSON.stringify({}),
                                    todo: JSON.stringify({}),
                                    hash
                                })
                            })
                            .then(res => res.json())
                            .then(data => {
                                if (data) {
                                    jobBoxEl.style.display = 'none';
                                    viewBoxEL.style.display = 'flex';
                                    viewBoxItem1TextEl.innerText = data['status'];
                                    viewBoxItem2TextEl.innerText = data['score'];
                                }
                            })
                            .catch(err => console.error(err));
                    }).catch((err) => console.error(err));
            }
        });
    }
    String.prototype.hashCode = function () {
        var hash = 0,
            i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
            chr = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
})();