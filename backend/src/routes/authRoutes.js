const { Router } = require('express');

module.exports = (controller, autenticar) => {
  const router = Router();
  router.post('/login', controller.login);
  router.get('/me', autenticar, controller.yo);
  return router;
};
