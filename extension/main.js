/** 
 * @author      Kushagra Gupta
 * @lastUpdated Tue Nov 15 23:57
 * @description This extension provides ability to bookmark 
 *              a job posting. User can return back to this job 
 *              posting and extension should be able to identify the 
 *              link and show necessary information e.g. resume used,
 *              date applied, status, creds, etc. User should be logged in
 *              is a precondition. User can also view this record in the web app. 
 *              Detailed docs available at softwright.in/job-helper
 * @license     Apache
 */
(() => {

    /**
     * 1) Check if user is logged in. If not show login form.
     * 2) Identify the link of the web page in current tab
     * 3) If link is present, show details:
     *      - Has the user applied
     *      - If applied show status, resume used & credentials if available
     *        & form to update status.
     *      - If not applied, show alpha resume and form to update status and save credentials if applicable
     * 4) If link is not present, show the form to save the job posting. Once a record for
     *    the posting is created, the Editor should generate alpha resume which should be available
     *    to the user in the extension popup.
     */
    const getUrlButton = document.getElementById('getUrl');
    // const getViewsButton = document.getElementById('getViews');
    // const getBackgroundPageButton = document.getElementById('getBackgroundPage');

    getUrlButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            // console.log(tabs);
            // chrome.tabs.get(tabs[0].id)
            //     .then(data => console.log(data))
            //     .catch(error => console.error(error));
            let url = tabs[0].url;
            // const linkEl = document.createElement('a');
            // linkEl.href = url;
            // linkEl.target = '_blank';
            // linkEl.click();
            console.log(url);
            fetch(
                "http://localhost:5454/html?url=" + url,
                { method: "get", mode: "cors" }
            )
                .then(function (response) {
                    // The API call was successful!
                    return response.text();
                }).then(function (html) {
                    // This is the HTML from our response as a text string
                    console.log(html);
                }).catch(function (err) {
                    // There was an error
                    console.warn('Something went wrong.', err);
                });
        });
    });

    // getViewsButton.addEventListener('click', () => {
    //     const views = chrome.extension.getViews();
    //     console.log(views);
    // });

    // getBackgroundPageButton.addEventListener('click', () => {
    //     const backgroundPage = chrome.extension.getBackgroundPage();
    //     console.log(backgroundPage);
    // });

})();