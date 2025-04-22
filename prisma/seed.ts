import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RegionJSON {
  region: string;
  lat: number;
  lon: number;
}

interface SettlementJSON {
  name: string;
  type: string;
  lat: number;
  lon: number;
  region: string;
}

interface EquipmentJSON {
  name: string;
}

const prisma = new PrismaClient();

async function importData() {
  try {
    const regionsData: RegionJSON[] = JSON.parse(
      await fs.readFile(path.join(__dirname, 'data/regions.json'), 'utf-8'),
    );
    const settlementsData: SettlementJSON[] = JSON.parse(
      await fs.readFile(path.join(__dirname, 'data/settlements.json'), 'utf-8'),
    );
    const equipmentData: EquipmentJSON[] = JSON.parse(
      await fs.readFile(path.join(__dirname, 'data/equipments.json'), 'utf-8'),
    );

    console.log('Importing regions...');
    for (const region of regionsData) {
      await prisma.region.upsert({
        where: { name: region.region },
        update: {
          latitude: region.lat,
          longitude: region.lon,
        },
        create: {
          name: region.region,
          latitude: region.lat,
          longitude: region.lon,
        },
      });
    }
    console.log('Regions imported.');

    console.log('Importing cities...');
    for (const settlement of settlementsData) {
      const region = await prisma.region.findUnique({
        where: { name: settlement.region },
      });

      if (!region) {
        console.warn(
          `Region ${settlement.region} not found for city ${settlement.name}. Skipping.`,
        );
        continue;
      }

      await prisma.settlement.upsert({
        where: {
          name_regionId: {
            name: settlement.name,
            regionId: region.id,
          },
        },
        update: {
          latitude: settlement.lat,
          longitude: settlement.lon,
          regionId: region.id,
        },
        create: {
          name: settlement.name,
          latitude: settlement.lat,
          longitude: settlement.lon,
          regionId: region.id,
        },
      });
    }
    console.log('Cities are imported.');

    console.log('Import of equipment...');
    for (const equipment of equipmentData) {
      await prisma.equipment.upsert({
        where: { name: equipment.name },
        update: {
          name: equipment.name,
        },
        create: {
          name: equipment.name,
        },
      });
    }
    console.log('The equipment is imported.');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
