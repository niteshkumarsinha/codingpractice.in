function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  // Verify JWT and check if user belongs to the Admin group
  // Assuming you are using AWS Cognito and JWT decoding library like jsonwebtoken
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
  if (decoded['cognito:groups'] && decoded['cognito:groups'].includes('Admin')) {
    next();  // User is admin, allow access
  } else {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
}