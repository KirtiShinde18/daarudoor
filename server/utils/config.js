const PRODUCTION = "production"
const FRONTEND_URL = process.env.NODE_ENV === PRODUCTION
    ? process.env.LIVE_URL
    : process.env.LOCAL_URL

module.exports = { PRODUCTION, FRONTEND_URL }