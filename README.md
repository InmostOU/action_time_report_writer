# google-drive-sheets-action

This action upload add rows in the end of your sheet

## Usage Example

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Write commit to timereport
        uses: InmostOU/action_timer_report_writer@main
        with:
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
          GOOGLE_REFRESH_TOKEN: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
          JIRA_PROJECT: ${{ secrets.JIRA_PROJECT }}
          JIRA_LINK: ${{ secrets.JIRA_LINK }}
          JIRA_KEY: ${{ secrets.JIRA_KEY }}
          DEVELOPERS: ${{ secrets.DEVELOPERS }}
          HEAD_COMMIT: ${{ toJSON(github.event.head_commit) }}
```

## Google Sheets Example

Example: [Google Sheets](https://docs.google.com/spreadsheets/d/15sxGZWqGPN_t4KoW5lInNMsOYMpmCZeBk0s5J4d9VdM/edit?usp=sharing)

## Commit Example

```
<!-- Example: -->
feat(GH-10): #time 1h 30m added translate service
fix(GH-15): #time 2h fixed styles for the home page
ref(GH-20): #time 30m moved styles to global
doc(GH-30): #time 4h added comments for the settings page
```

## Inputs

#### GOOGLE_CLIENT_ID [Required]

Your Client ID (see [Environment Set Up](#Environment-Set-Up) for more details)

#### GOOGLE_CLIENT_SECRET [Required]

Your Client Secret (see [Environment Set Up](#Environment-Set-Up) for more details)

#### GOOGLE_REFRESH_TOKEN [Required]

Your Refresh Token (see [Environment Set Up](#Environment-Set-Up) for more details)

#### JIRA_PROJECT [Required]

Project Name

```
GitHub
```

#### JIRA_LINK [Required]

Jira Link:

```
https://project.atlassian.net/browse/
```

#### JIRA_KEY [Required]

Find this key in any task in Jira

```
GH
```

#### DEVELOPERS [Required]

Your team, which specified links to their Time Report files in Google Sheets

```json
{
  "value": [
    {
      "email": "user1@gmail.com",
      "name": "First Last",
      "username": "FirstLast1234",
      "googleSheetId": "...",
      "googleSheetPageId": "..."
    },
    {
      "email": "user2@gmail.com",
      "name": "First Last",
      "username": "FirstLast1234",
      "googleSheetId": "...",
      "googleSheetPageId": "..."
    }
  ]
}
```

- googleSheetId

The primary object in Google Sheets that can contain multiple sheets, each with structured information contained in cells. Every spreadsheet is represented by a Spreadsheet resource and has a unique spreadsheetId value, containing letters, numbers, hyphens, or underscores. You can find the spreadsheet ID in a Google Sheets URL:

```
https://docs.google.com/spreadsheets/d/spreadsheetId/edit#gid=0
```

- googleSheetPageId

A page or tab within a spreadsheet. Each sheet is represented by a Sheet resource and has a unique title and numeric sheetId value. You can find the sheet ID in a Google Sheets URL:

```
https://docs.google.com/spreadsheets/d/aBC-123_xYz/edit#gid=sheetId
```

#### HEAD_COMMIT [Required]

Insert your commit details

```
with:
  ...
  HEAD_COMMIT: ${{ toJSON(github.event.head_commit) }}
```

### Environment Set Up

[Notion](https://oil-narcissus-b29.notion.site/Setup-Google-Client-Secret-Client-ID-Refresh-Token-Spread-Sheet-API-73f1b1f0f1b94774ae61694f1877623e)
