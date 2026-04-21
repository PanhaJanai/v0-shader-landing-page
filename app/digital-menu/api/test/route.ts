import fs from 'fs';

interface Order {
  itemId: number;
  quantity: number;
  price: number;
  discounted_price: number;
}

export async function POST(request: Request) {
  const body = await request.json();
  const filePath = 'test.json';

  let data: Order[] = [];

  if (fs.existsSync(filePath)) {
    // Read and parse existing data
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    try {
      data = JSON.parse(fileContent);
      if (!Array.isArray(data)) data = [];
    } catch {
      data = [];
    }
  }

  // Add new entry
  data.push(body);

  // Write back to file
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));

  return Response.json({ message: `Received: ${JSON.stringify(body)}` });
}