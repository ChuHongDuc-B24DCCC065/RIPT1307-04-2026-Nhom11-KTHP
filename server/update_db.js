const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "diendanhoidapsinhvien"
});

async function updateDb() {
  const columns = [
    "fullName VARCHAR(255)",
    "phoneNumber VARCHAR(20)",
    "school VARCHAR(255)",
    "bio TEXT",
    "website VARCHAR(255)"
  ];
  for (let col of columns) {
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN ${col}`);
      console.log(`Added ${col}`);
    } catch (e) {
      console.log(`Skipped ${col}:`, e.message);
    }
  }
  process.exit();
}
updateDb();
