import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

let prismaClient: any;

export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: any;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.warn('DATABASE_URL not set. PrismaService is in mock mode.');
      this.prisma = null;
      return;
    }

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    const { PrismaClient } = require('../../prisma/generated/prisma');
    this.prisma = new PrismaClient({ adapter });
  }

  get user() {
    return this.prisma?.user;
  }

  async onModuleInit() {
    if (this.prisma) {
      await this.prisma.$connect();
    }
  }

  async onModuleDestroy() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
