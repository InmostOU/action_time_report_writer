function findUser(committer, users) {
    for (let user of users) {
        if (user.email === committer.email) {
            return user;
        }
    }
    return null;
}

module.exports = {
    findUser,
}
