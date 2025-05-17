const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 60 * 60 * 1000;

exports.loginLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, last: now, blockedUntil: null };
  }
  const attempt = loginAttempts[ip];
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return res.status(429).json({ message: 'Muitas tentativas de login. Tente novamente em 1 hora.' });
  }
  if (now - attempt.last > BLOCK_TIME) {
    attempt.count = 0;
    attempt.blockedUntil = null;
  }
  attempt.last = now;
  req._loginAttempt = attempt;
  next();
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const usersWithoutPassword = users.map(user => {
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.__v;
      if (user.updatedAt) userObj.updatedAt = user.updatedAt;
      return userObj;
    });
    res.status(200).json(usersWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    if (user.updatedAt) userObj.updatedAt = user.updatedAt;
    res.status(200).json(userObj);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }
    let userRole = 'user';
    if (role === 'admin') {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Apenas admin pode criar outro admin' });
      }
      userRole = 'admin';
    }
    const newUser = await User.create({ name, email, password, role: userRole });
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.__v;
    if (newUser.updatedAt) userResponse.updatedAt = newUser.updatedAt;
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, secret, { expiresIn: '1d' });
    res.status(201).json({ ...userResponse, token });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar usuário', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'Usuário não encontrado' });
    const userObj = updatedUser.toObject();
    delete userObj.password;
    delete userObj.__v;
    userObj.updatedAt = updatedUser.updatedAt;
    res.status(200).json(userObj);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar usuário', error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      req._loginAttempt.count++;
      if (req._loginAttempt.count >= MAX_ATTEMPTS) {
        req._loginAttempt.blockedUntil = Date.now() + BLOCK_TIME;
      }
      return res.status(400).json({ message: 'E-mail ou senha inválidos' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req._loginAttempt.count++;
      if (req._loginAttempt.count >= MAX_ATTEMPTS) {
        req._loginAttempt.blockedUntil = Date.now() + BLOCK_TIME;
      }
      return res.status(400).json({ message: 'E-mail ou senha inválidos' });
    }
    req._loginAttempt.count = 0;
    req._loginAttempt.blockedUntil = null;
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn: '1d' });
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    res.status(200).json({ ...userObj, token });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno no login', error: err.message });
  }
};

exports.validateLogin = [
  body('email').isEmail().withMessage('E-mail inválido').normalizeEmail(),
  body('password').isString().isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
];

exports.validateRegister = [
  body('name').isString().trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido').normalizeEmail(),
  body('password').isString().isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
];
