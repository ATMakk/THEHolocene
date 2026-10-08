const jwt = require("jsonwebtoken");

const verifyUser = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).send({ message: "User unauthorized" });
    }

    const parts = authHeader.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];

    jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
      (err, decoded) => {
        if (err) {
          console.log(err);
          return res.status(401).send({ message: "User unauthorized" });
        }
        req.user = decoded;
        next();
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(401).send({ message: "User unauthorized" });
  }
};

module.exports = verifyUser;