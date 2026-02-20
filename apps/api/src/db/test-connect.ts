import { sql } from './connect.js';

async function testConnection() {
  try {
    console.log('正在嘗試連接到 Neon...');
    const result = await sql`SELECT uuidv7() as uuid`;
    console.log('uuidv7() 測試成功！', result[0].uuid);
  } catch (error) {
    console.error('uuidv7() 測試失敗：', error);
  }
}

testConnection();
