const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

/**
 * Verify a Google id_token and upsert the user.
 * Returns { token, user } on success.
 */
const verifyAndUpsertUser = async (idToken) => {
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new Error('Invalid Google id_token');
  }

  const { sub: googleId, email, name, picture } = payload;

  // Find existing user by googleId OR link by email
  let user = await User.findOne({ googleId });
  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      // Link Google account to existing email-based account
      user.googleId = googleId;
      user.googleAccessToken = null; // not needed for GIS flow
      user.lastActive = new Date();
      await user.save({ validateBeforeSave: false });
    }
  }

  if (!user) {
    // Create new Google user
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      googleId,
      avatar: picture || '',
      emailVerified: true,
      lastActive: new Date(),
    });
  } else {
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });
  }

  const token = user.generateJWT();
  return { token, user };
};

module.exports = { verifyAndUpsertUser };