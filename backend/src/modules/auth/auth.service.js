import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model.js';
import { env } from '../../config/env.js';

export const authService = {
  async register({ email, password, name }) {
    if (!email || !password || !name) {
      const err = new Error('Email, password, and name are required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('User with this email already exists.');
      err.code = 'EMAIL_IN_USE';
      err.status = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      name,
      passwordHash,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: { id: user._id, email: user.email, name: user.name }, token };
  },

  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.status = 401;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.status = 401;
      throw err;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: { id: user._id, email: user.email, name: user.name }, token };
  }
};
