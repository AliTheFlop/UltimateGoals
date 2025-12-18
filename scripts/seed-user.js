const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // You might need to install bcryptjs if not in devDependencies, or run with ts-node if using modules. But simple js is easier.
// Actually project uses bcryptjs.

// Parse args
const args = process.argv.slice(2);
const username = args[0] || 'fishslayer27';
const password = args[1] || 'password123';
const mongoUri = args[2] || process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found. Pass it as 3rd arg or set env var.');
  console.log('Usage: node scripts/seed-user.js <username> <password> <mongodb_uri>');
  process.exit(1);
}

// Minimal User Schema for seeding
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`User '${username}' already exists. Updating password...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('Password updated.');
    } else {
      console.log(`Creating user '${username}'...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        username,
        password: hashedPassword,
        name: username,
      });
      console.log('User created.');
    }

    await mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
