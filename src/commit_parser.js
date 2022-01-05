function isNumeric(str) {
    return /^\d+$/.test(str);
}

function hasTimeSuffix(char) {
    return char === 'd' || char === 'h' || char === 'm';
}

function convertCommitTime(commitTime) {
    const result = ['00', '00', '00'];

    for (let i = 0; i < commitTime.length; i++) {
        let suffix = commitTime[i].suffix;
        let time = commitTime[i].time.toString();
        if (time.length < 2) {
            time = '0' + time;
        }

        if (suffix === 'h') {
            result[0] = time;
        } else if (suffix === 'm') {
            result[1] = time;
        }
    }

    return result.join(':');
}

/*
Example:
Input: feat(JRS-154): #time 2h 30m some message
Output:
{
  firstIndexKey: 5, // First char: J
  lastIndexKey: 7, // Last char: S
  firstIndexKeyWithNumber: 5, // First char: J
  lastIndexKeyWithNumber: 12, // Last char: 4
  fullKey: 'JRS-154',
  numberKey: 154
}
 */
function parseCommitKey(key, commit) {
    let firstIndexKey = commit.indexOf(key + '-');
    let lastIndexKey = firstIndexKey + (key.length - 1);
    let fullKey = [];
    let numberKey = [];
    let firstIndexKeyWithNumber = firstIndexKey;
    let lastIndexKeyWithNumber = -1;

    // Key not found in a commit
    if (firstIndexKey === -1) {
        return null;
    }

    // Key doesn't contain a symbol -
    if (commit[lastIndexKey + 1] !== '-') {
        return null;
    }

    // [lastIndexKey + 2] = 2 because we start after the character -
    for (let i = lastIndexKey + 2; i < commit.length; i++) {
        let char = commit.charAt(i);
        if (isNumeric(char)) {
            numberKey.push(char);
            continue;
        }

        lastIndexKeyWithNumber = i;
        break;
    }

    // Number Key not found in a commit
    if (numberKey.length === 0) {
        return null;
    }

    // If Key in the end of the commit
    if (lastIndexKeyWithNumber === -1) {
        lastIndexKeyWithNumber = commit.length;
    }

    for (let i = firstIndexKeyWithNumber; i < lastIndexKeyWithNumber; i++) {
        let char = commit.charAt(i);
        fullKey.push(char);
    }

    try {
        fullKey = fullKey.join('');
        numberKey = parseInt(numberKey.join(''));
    } catch (e) {
        return null;
    }

    return {
        firstIndexKey,
        lastIndexKey,
        firstIndexKeyWithNumber,
        lastIndexKeyWithNumber,
        fullKey,
        numberKey,
    };
}

/*
Example:
Input: feat(JRS-1): #time 1d 2h 30m some message
Output:
{
  commitTime: [
    { time: 1, suffix: 'd' },
    { time: 2, suffix: 'h' },
    { time: 30, suffix: 'm' }
  ],
  sheetsTime: '01:02:30.000'
}
 */
function parseCommitTime(key, commit) {
    const tag = '#time';
    const commitTime = [];
    let firstIndexAfterTime = commit.indexOf(tag) + tag.length;
    let lastIndexAfterTime = -1;

    if (commit.includes(tag) === false) {
        return null;
    }

    if (commit[firstIndexAfterTime] !== ' ') {
        return null;
    }

    let time = [];
    let timeSuffix = '';
    let hasNumber = false;
    for (let i = firstIndexAfterTime + 1; i < commit.length; i++) {
        const currentChar = commit[i];
        const nextChar = commit[i + 1];
        if (isNumeric(currentChar)) {
            time.push(currentChar);
            hasNumber = true;
        } else if ((nextChar === ' ' || nextChar === undefined) && hasTimeSuffix(currentChar)) {
            if (hasNumber) {
                time.push(currentChar);
                timeSuffix = currentChar;
                commitTime.push({
                    time: Number.parseInt(time.join('')),
                    suffix: timeSuffix,
                });
            }
            time = [];
            timeSuffix = '';
            hasNumber = false;
        } else if (currentChar === ' ') {
            if (isNumeric(nextChar) === false) {
                continue;
            }
            time = [];
            hasNumber = false;
        } else {
            lastIndexAfterTime = i - 1;
            break;
        }
    }

    if (lastIndexAfterTime === -1) {
        lastIndexAfterTime = commit.length;
    }

    return {
        commitTime,
        sheetsTime: convertCommitTime(commitTime),
        firstIndexAfterTime,
        lastIndexAfterTime,
    };
}

function parseCommitMessage(key, commit, parsedCommitKey, parsedCommitTime) {
    function findMessage(startIndex) {
        let message = [];
        for (let i = startIndex; i < commit.length; i++) {
            const char = commit.charAt(i);
            message.push(char);
        }
        return message.join('').trim();
    }

    if (parsedCommitTime) {
        return findMessage(parsedCommitTime.lastIndexAfterTime);
    }

    if (parsedCommitKey) {
        // Check if commit has -> ): and ignore this
        let lastIndex = parsedCommitKey.lastIndexKeyWithNumber;
        if (commit[lastIndex] === ')' && commit[lastIndex + 1] === ':') {
            lastIndex += 2;
        } else if (commit[lastIndex] === ':') {
            lastIndex += 1;
        }
        return findMessage(lastIndex);
    }

    return commit;
}

function parseCommit(key, commit) {
    if (key === undefined || key === null) {
        throw new Error('[parseMessageKey] error: key not found');
    }
    if (commit === undefined || commit === null) {
        throw new Error('[parseMessageKey] error: message not found');
    }

    const parsedCommitKey = parseCommitKey(key, commit);
    const parsedCommitTime = parseCommitTime(key, commit);
    const parsedCommitMessage = parseCommitMessage(key, commit, parsedCommitKey, parsedCommitTime);

    return {
        commitKey: parsedCommitKey,
        commitTime: parsedCommitTime,
        commitMessage: parsedCommitMessage,
    };
}

module.exports = {
    parseCommit,
};
