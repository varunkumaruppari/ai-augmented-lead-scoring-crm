const userRepo = require('../repositories/user.repository');

const respond = (res, data, status = 200) => res.status(status).json({ success: true, ...data });

const getAll = async (req, res, next) => {
  try {
    const users = await userRepo.findAll();
    respond(res, { data: users });
  } catch (err) { next(err); }
};

module.exports = { getAll };
