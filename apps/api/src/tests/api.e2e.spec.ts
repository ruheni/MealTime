import { AppModule } from '../app.module';
import { CreateStoreDto } from '@meal-time/api-interfaces';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { PrismaService } from '../services/prisma/prisma.service';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      })
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Stores', () => {
    describe('Create store', () => {
      const dto: CreateStoreDto = {
        name: 'Rema 1000',
      };
      it('should create store', async () => {
        return pactum
          .spec()
          .post('/stores')
          .withBody(dto)
          .expectStatus(201)
          .stores('storeId', 'id');
      });
    });
  });
});