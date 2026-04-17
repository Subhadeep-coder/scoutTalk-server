describe('PrismaService', () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeAll(() => {
    delete process.env.DATABASE_URL;
  });

  afterAll(() => {
    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it('should be in mock mode when DATABASE_URL is not set', async () => {
    const { PrismaService } = require('../../src/prisma/prisma.service');
    const service = new PrismaService();
    expect(service.user).toBeFalsy();
  });
});
