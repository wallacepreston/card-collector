const app = require('./index');
const { sequelize } = require('./db');

const { PORT = 4000 } = process.env;

app.listen(PORT, () => {
  console.log(`Jokes are ready at http://localhost:${PORT}`);
});
