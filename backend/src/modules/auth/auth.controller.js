import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const { user, token } = await authService.register({ email, password, name });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({
      status: 'ok',
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(200).json({
      status: 'ok',
      message: 'Logged in successfully',
      user,
      token
    });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({
    status: 'ok',
    message: 'Logged out successfully'
  });
};

export const me = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    user: req.user
  });
};
