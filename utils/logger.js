const IS_PROD = process.env.NODE_ENV === 'production';

const logger = {
  debug: (...args) => { if (!IS_PROD) console.log(...args); },
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};

module.exports = logger;
