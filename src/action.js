const core = require('@actions/core');
const {google} = require('googleapis');
const commitParser = require('./commit_parser');
const helper = require('./helper');

const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const CLIENT_ID = core.getInput('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = core.getInput('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = core.getInput('GOOGLE_REFRESH_TOKEN') || process.env.GOOGLE_REFRESH_TOKEN;
const DEVELOPERS = core.getInput('DEVELOPERS') ? JSON.parse(core.getInput('DEVELOPERS')) : JSON.parse(process.env.DEVELOPERS);
const JIRA_PROJECT = core.getInput('JIRA_PROJECT') || process.env.JIRA_PROJECT;
const JIRA_LINK = core.getInput('JIRA_LINK') || process.env.JIRA_LINK;
const JIRA_KEY = core.getInput('JIRA_KEY') || process.env.JIRA_KEY;
const MAX_SHEET_ROWS = 1000;

const HEAD_COMMIT = {
    "author": {
        "email": "vlad.kozlov@inmost.pro",
        "name": "Vlad Kozlov",
        "username": "VladKozlov368"
    },
    "committer": {
        "email": "vlad.kozlov@inmost.pro",
        "name": "Vlad Kozlov",
        "username": "VladKozlov368"
    },
    "distinct": true,
    "id": "780be89d71a27fad4b46158191dd16958011a64f",
    "message": "feat(DP-20): #time 20m message",
    "timestamp": "2021-11-07T21:37:59+02:00",
    "tree_id": "3480cdb1f96d2f5cabbebc128bc8bc437d51de4c",
    "url": "https://github.com/GadHakim/flutter-action/commit/780be89d71a27fad4b46158191dd16958011a64f"
};

if (HEAD_COMMIT === undefined) {
    throw new Error('HEAD_COMMIT not found');
}

const CURRENT_USER = helper.findUser(HEAD_COMMIT.committer, DEVELOPERS.value);
if (CURRENT_USER === null) {
    console.log('CURRENT_USER not found');
    console.log('committer:', HEAD_COMMIT.committer);
    return;
}

const SHEET_ID = CURRENT_USER.googleSheetId;
const SHEET_PAGE_ID = CURRENT_USER.googleSheetPageId;
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

const sheets = google.sheets({
    version: 'v4',
    auth: oauth2Client,
});

// Example: 25.12
function getToday() {
    const now = new Date();
    let day = now.getDate().toString();
    if (day.length < 2) {
        day = '0' + day;
    }
    let month = (now.getMonth() + 1).toString();
    if (month.length < 2) {
        month = '0' + month;
    }
    return day + '.' + month;
}

// Example: 6/24/2021
function getCurrentDate() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return month + '/' + day + '/' + year;
}

async function getCurrentRowRangeDay() {
    const responseData = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `A1:A${MAX_SHEET_ROWS}`,
    });

    const dateColumn = responseData.data.values;
    const today = getToday();
    let startRowIndexDay = -1;
    let endRowIndexDay = -1;

    for (let i = 0; i < dateColumn.length; i++) {
        let date = dateColumn[i][0];
        if (date === today) {
            if (startRowIndexDay === -1) {
                startRowIndexDay = i;
            } else {
                endRowIndexDay = i;
            }
        }
    }

    if (endRowIndexDay === -1) {
        endRowIndexDay = startRowIndexDay;
    }

    if (startRowIndexDay === -1 || endRowIndexDay === -1) {
        throw new Error('Not found current day');
    }

    return {
        startRowIndexDay,
        endRowIndexDay,
    };
}

async function insertRow(row, data) {
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
            requests: [
                {
                    insertDimension: {
                        range: {
                            sheetId: SHEET_PAGE_ID,
                            dimension: "ROWS",
                            startIndex: row,
                            endIndex: row + 1,
                        },
                        inheritFromBefore: false,
                    }
                },
            ],
        },
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `A${row + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [
                data,
            ],
        },
    });
}

function generateData(parsedCommit) {
    const commitTime = parsedCommit.commitTime ? parsedCommit.commitTime.sheetsTime : undefined;
    const jiraKey = parsedCommit.commitKey ? parsedCommit.commitKey.fullKey : undefined;

    return [getCurrentDate(),
        JIRA_PROJECT,
        parsedCommit.commitMessage,
        commitTime,
        undefined,
        undefined,
        jiraKey ? JIRA_LINK + jiraKey : undefined,
    ];
}

async function main() {
    const currentRowRangeDay = await getCurrentRowRangeDay();
    const parsedCommit = commitParser.parseCommit(JIRA_KEY, HEAD_COMMIT.message);
    const rowData = generateData(parsedCommit);
    await insertRow(currentRowRangeDay.endRowIndexDay, rowData);
}

main()
    .then(() => console.log('inserted row in Excel successfully'))
    .catch((err) => core.setFailed(`Failed -> ${err}`));
