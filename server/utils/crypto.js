const crypto = require('crypto');

// The ENCRYPTION_KEY should be 32 bytes (64 hex characters) for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // fallback if not set, though it should be set
const IV_LENGTH = 16; // For AES, this is always 16

exports.encryptData = (text) => {
    if (!text) return text;
    // ensure key is 32 bytes
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

exports.decryptData = (text) => {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = Buffer.from(ENCRYPTION_KEY, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error.message);
        return null;
    }
};

exports.hashData = (text) => {
    if (!text) return text;
    // SHA-256 hash for exact match querying/uniqueness without exposing data
    return crypto.createHash('sha256').update(text).digest('hex');
};

exports.maskAadhaar = (aadhaar) => {
    if (!aadhaar || aadhaar.length !== 12) return aadhaar;
    return '########' + aadhaar.substring(8);
};

exports.maskPan = (pan) => {
    if (!pan || pan.length !== 10) return pan;
    return '######' + pan.substring(6);
};
