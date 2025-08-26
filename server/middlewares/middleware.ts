import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "@models/user";
import { AuthenticatedRequest } from "@middlewares/types";
import { RequireRole } from "@middlewares/types";
import { IUser } from "@models/types/user";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const generateToken = (user: { _id: string; role: string; email: string }) => {
  return jwt.sign({ _id: user._id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded._id);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole = (roles: Array<RequireRole>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser | undefined;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
};
