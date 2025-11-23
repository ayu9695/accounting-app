/**
 * Logs a change to a document's update history array.
 * * @param {object} doc - The Mongoose document object (e.g., the Client instance).
 * @param {object} req - The Express request object, expected to contain req.user.userId.
 * @param {string} key - The name of the attribute that was changed (e.g., 'email').
 * @param {*} oldVal - The original value of the attribute.
 * @param {*} newVal - The new value of the attribute.
 */
const logUpdateHistory = (userId, key, oldVal, newVal) => {

    // Construct and push the history entry
    doc.updateHistory.push({
        attribute: key,
        oldValue: oldVal,
        newValue: newVal,
        updatedAt: new Date(),
        updatedBy: userId
    });

    console.log(`History logged for '${key}': ${oldVal} -> ${newVal}`);
};

module.exports = { logUpdateHistory };