import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  console.log(token);
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  };

  jwt.verify(token, '6QrfbTcyLnFcjBzG4NXth7YjzCktNj' , (err, user) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ message: 'Invalid or expire token' });
    }
    console.log(user);

    req.user = user;
    next();
  });
};

