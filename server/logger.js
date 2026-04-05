const isDev = process.env.NODE_ENV !== 'production';

function stamp() {
  return new Date().toISOString();
}

function fmt(level, msg, meta) {
  const base = `[${stamp()}] ${level.padEnd(5)} ${msg}`;
  return meta && Object.keys(meta).length ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
  info:  (msg, meta = {}) => console.log(fmt('INFO',  msg, meta)),
  warn:  (msg, meta = {}) => console.warn(fmt('WARN',  msg, meta)),
  error: (msg, meta = {}) => console.error(fmt('ERROR', msg, meta)),
  debug: (msg, meta = {}) => { if (isDev) console.debug(fmt('DEBUG', msg, meta)); },
};
