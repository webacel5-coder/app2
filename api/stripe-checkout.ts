
// Stripe integration removed to fix build errors.
// All donations now use the direct external link (RecargaPay) defined in LandingPage.tsx
export default async function handler(req: any, res: any) {
  return res.status(410).json({ error: 'Stripe endpoint removed' });
}
