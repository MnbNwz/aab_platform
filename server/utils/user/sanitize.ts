const sanitizeUser = (user: any) => {
  if (!user) return user;
  const doc = typeof user.toObject === "function" ? user.toObject() : user;
  delete doc.stripeCustomerId;
  delete doc.stripeConnectAccountId;
  delete doc.stripeConnectStatus;
  return doc;
};

const sanitizeUsers = (users: any[]) => users.map(sanitizeUser);
export { sanitizeUser, sanitizeUsers };
