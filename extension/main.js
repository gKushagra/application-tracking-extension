/** 
 * @author      Kushagra Gupta
 * @license     Apache
 */
(() => {
    const getUrlButton = document.getElementById('getUrl');
    getUrlButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            fetch(
                "http://localhost:5454/html?url=" + url,
                { method: "get", mode: "cors" }
            )
                .then(function (response) {
                    return response.text();
                }).then(function (html) {
                    // console.log(html);
                }).catch(function (err) {
                    console.warn('Something went wrong.', err);
                });
        });
    });
})();