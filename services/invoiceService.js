/**
 * Logs a change to a document's update history array.
 * * @param {object} doc - The Mongoose document object (e.g., the Client instance).
 * @param {object} req - The Express request object, expected to contain req.user.userId.
 * @param {string} key - The name of the attribute that was changed (e.g., 'email').
 * @param {*} oldVal - The original value of the attribute.
 * @param {*} newVal - The new value of the attribute.
 */
exports.logUpdateHistory = async (doc, userId, key, oldVal, newVal) => {

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

exports.logPaymentHistory = async (doc, userId, amount, paymentDate, paymentMethod, reference, notes ) => {
    // paymentMethod can be ObjectId (from PaymentMethod model) or null/undefined
    // Construct and push the payment entry
    doc.paymentHistory.push({
        amount: amount,
        paymentDate: paymentDate,
        paymentMethod: paymentMethod || null, // Store ObjectId reference or null
        reference: reference,
        notes: notes,
        recordedBy: userId,
        recordedAt: new Date()
    });
  
    console.log(`History logged for payment: ${amount} recorded by ${userId}`);
};
