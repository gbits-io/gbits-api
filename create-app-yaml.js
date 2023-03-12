require('dotenv').config();

const fs = require('fs');

const appYamlContent = `runtime: nodejs14
env_variables:
  DB_URL: ${process.env.DB_URL}
  SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY}
  CLIENT_ID: ${process.env.CLIENT_ID}
  PRIVATE_KEY:  ${process.env.PRIVATE_KEY}
  CLIENT_EMAIL:  ${process.env.CLIENT_EMAIL}
  JWT_SECRET_USERS:  ${process.env.JWT_SECRET_USERS}
  MINT_ACCOUNT_SECRET_KEY:  ${process.env.MINT_ACCOUNT_SECRET_KEY}
  HELIUS_API_KEY:  ${process.env.HELIUS_API_KEY}`;

fs.writeFileSync('./app.yaml', appYamlContent);
