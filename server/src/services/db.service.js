const mongoose = require('mongoose');

const runTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    }, {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });
    return result;
  } finally {
    session.endSession();
  }
};

module.exports = {
  runTransaction
};
