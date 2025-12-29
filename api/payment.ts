
// Payment integration removed to fix build errors.
export default async function handler(req: any, res: any) {
  return res.status(410).json({ error: 'Endpoint disabled' });
}
