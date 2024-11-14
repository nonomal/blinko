import crypto from 'crypto'

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve('$pbkdf2$:' + salt + ':' + derivedKey.toString('hex'));
    });
  });
}

export async function verifyPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [prefix, salt, hash] = hashedPassword.split(':');
    if (prefix !== '$pbkdf2$') {
      return resolve(false);
    }
    crypto.pbkdf2(inputPassword, salt!, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === hash);
    });
  });
}