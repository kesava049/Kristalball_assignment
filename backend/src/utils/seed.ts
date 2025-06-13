
import bcrypt from 'bcryptjs';
import { prisma } from '../index';

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingUser = await prisma.user.findFirst();
    if (existingUser) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // Create roles
    const adminRole = await prisma.role.create({
      data: {
        roleName: 'Admin',
        description: 'Full system access'
      }
    });

    const commanderRole = await prisma.role.create({
      data: {
        roleName: 'Base Commander',
        description: 'Base-specific command access'
      }
    });

    const logisticsRole = await prisma.role.create({
      data: {
        roleName: 'Logistics Officer',
        description: 'Limited logistics operations access'
      }
    });

    // Create bases
    const base1 = await prisma.base.create({
      data: {
        baseName: 'Fort Alpha',
        location: 'Northern Region',
        description: 'Primary training facility'
      }
    });

    const base2 = await prisma.base.create({
      data: {
        baseName: 'Camp Bravo',
        location: 'Eastern Region',
        description: 'Forward operating base'
      }
    });

    const base3 = await prisma.base.create({
      data: {
        baseName: 'Station Charlie',
        location: 'Southern Region',
        description: 'Supply depot'
      }
    });

    // Create equipment types
    const vehicleType = await prisma.equipmentType.create({
      data: {
        typeName: 'Vehicle',
        category: 'Ground',
        description: 'Military vehicles and transport'
      }
    });

    const weaponType = await prisma.equipmentType.create({
      data: {
        typeName: 'Small Arms',
        category: 'Weapons',
        description: 'Individual and crew-served weapons'
      }
    });

    const ammoType = await prisma.equipmentType.create({
      data: {
        typeName: 'Ammunition',
        category: 'Consumable',
        description: 'Various ammunition types'
      }
    });

    const commType = await prisma.equipmentType.create({
      data: {
        typeName: 'Communications',
        category: 'Electronics',
        description: 'Radio and communication equipment'
      }
    });

    // Create sample assets
    const vehicle1 = await prisma.asset.create({
      data: {
        equipmentTypeId: vehicleType.id,
        modelName: 'HMMWV M1114',
        serialNumber: 'VEH001',
        currentBaseId: base1.id,
        status: 'Operational',
        isFungible: false,
        currentBalance: 1
      }
    });

    const rifle = await prisma.asset.create({
      data: {
        equipmentTypeId: weaponType.id,
        modelName: 'M4A1 Carbine',
        currentBaseId: base1.id,
        status: 'Operational',
        isFungible: true,
        currentBalance: 50
      }
    });

    const ammo556 = await prisma.asset.create({
      data: {
        equipmentTypeId: ammoType.id,
        modelName: '5.56mm NATO',
        currentBaseId: base1.id,
        status: 'Operational',
        isFungible: true,
        currentBalance: 10000
      }
    });

    const radio = await prisma.asset.create({
      data: {
        equipmentTypeId: commType.id,
        modelName: 'AN/PRC-152',
        currentBaseId: base2.id,
        status: 'Operational',
        isFungible: true,
        currentBalance: 25
      }
    });

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@military.gov',
        passwordHash: adminPassword,
        fullName: 'System Administrator'
      }
    });

    // Create base commander
    const commanderPassword = await bcrypt.hash('commander123', 10);
    const commanderUser = await prisma.user.create({
      data: {
        username: 'commander',
        email: 'commander@military.gov',
        passwordHash: commanderPassword,
        fullName: 'Base Commander Alpha'
      }
    });

    // Create logistics officer
    const logisticsPassword = await bcrypt.hash('logistics123', 10);
    const logisticsUser = await prisma.user.create({
      data: {
        username: 'logistics',
        email: 'logistics@military.gov',
        passwordHash: logisticsPassword,
        fullName: 'Logistics Officer'
      }
    });

    // Assign roles
    await prisma.userRole.createMany({
      data: [
        { userId: adminUser.id, roleId: adminRole.id },
        { userId: commanderUser.id, roleId: commanderRole.id },
        { userId: logisticsUser.id, roleId: logisticsRole.id }
      ]
    });

    // Assign bases
    await prisma.userBase.createMany({
      data: [
        // Admin has access to all bases
        { userId: adminUser.id, baseId: base1.id },
        { userId: adminUser.id, baseId: base2.id },
        { userId: adminUser.id, baseId: base3.id },
        // Commander has access to Fort Alpha
        { userId: commanderUser.id, baseId: base1.id },
        // Logistics officer has access to Fort Alpha
        { userId: logisticsUser.id, baseId: base1.id }
      ]
    });

    // Create sample purchase
    await prisma.purchase.create({
      data: {
        assetId: rifle.id,
        quantity: 50,
        unitCost: 800.00,
        totalCost: 40000.00,
        purchaseDate: new Date('2024-01-15'),
        supplierInfo: 'Defense Contractor ABC',
        receivingBaseId: base1.id,
        purchaseOrderNumber: 'PO-2024-001',
        recordedByUserId: logisticsUser.id
      }
    });

    // Create sample transfer
    await prisma.transfer.create({
      data: {
        assetId: radio.id,
        quantity: 5,
        sourceBaseId: base2.id,
        destinationBaseId: base1.id,
        transferDate: new Date('2024-01-20'),
        reason: 'Equipment redistribution',
        status: 'Completed',
        initiatedByUserId: logisticsUser.id,
        receivedByUserId: commanderUser.id,
        completedAt: new Date('2024-01-21')
      }
    });

    // Create sample assignment
    await prisma.assignment.create({
      data: {
        assetId: vehicle1.id,
        assignedToUserId: commanderUser.id,
        assignmentDate: new Date('2024-01-10'),
        baseOfAssignmentId: base1.id,
        purpose: 'Command vehicle',
        recordedByUserId: logisticsUser.id
      }
    });

    // Create sample expenditure
    await prisma.expenditure.create({
      data: {
        assetId: ammo556.id,
        quantityExpended: 500,
        expenditureDate: new Date('2024-01-25'),
        baseId: base1.id,
        reason: 'Training exercise',
        reportedByUserId: commanderUser.id
      }
    });

    console.log('Database seeded successfully');
    console.log('Admin user: admin / admin123');
    console.log('Commander user: commander / commander123');
    console.log('Logistics user: logistics / logistics123');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
