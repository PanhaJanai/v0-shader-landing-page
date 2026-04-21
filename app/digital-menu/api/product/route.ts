// src/app/api/item/route.ts
import Database from 'better-sqlite3';
// import { itemsBackup } from '@/app/state/cartItemSlice';

interface Order {
  itemId: number;
  quantity: number;
  price: number;
  discounted_price: number;
}

const db = new Database('mydb.sqlite');

  // db.prepare(`
  //   CREATE TABLE IF NOT EXISTS orders (
  //     orderId INTEGER PRIMARY KEY,
  //     itemId INTEGER NOT NULL,
  //     quantity INTEGER NOT NULL,
  //     price REAL NOT NULL,
  //     discounted_price REAL NOT NULL
  //   )
  // `).run();

  // db.prepare(`
  //   CREATE TABLE IF NOT EXISTS item (
  //     id INTEGER PRIMARY KEY,
  //     name TEXT NOT NULL,
  //     price REAL NOT NULL,
  //     discounted_price REAL NOT NULL,
  //     category INTEGER NOT NULL,
  //     cover TEXT NOT NULL
  //   )
  // `).run();

  // itemsBackup.forEach(item => {
  //   db.prepare('INSERT INTO item (id, name, price, discounted_price, category, cover) VALUES (?, ?, ?, ?, ?, ?)')
  //     .run(item.id, item.name, item.price, item.discounted_price, item.category, item.cover);
  // });

export async function GET() {
  const item = db.prepare('SELECT * FROM item').all();
  return Response.json(item);
}

export async function POST(request: Request) {
  try {
    const orders = await request.json();
    orders.forEach((order: Order) => {
      db.prepare('INSERT INTO orders (itemId, quantity, price, discounted_price) VALUES (?, ?, ?, ?)')
        .run(order.itemId, order.quantity, order.price, order.discounted_price);
    });
    // return Response.json({ message: 'Orders placed successfully!' });
    // return back the http request from the client's fetch
    return Response.json({ orders }, { status: 201 });
  } catch (error) {
    console.error('POST /api/product error:', error);
    return Response.json({ error: 'Internal Server Error!'  }, { status: 500 });
  }
}