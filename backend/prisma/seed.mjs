// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear previous data
  await prisma.match.deleteMany();
  await prisma.clothingImage.deleteMany();
  await prisma.clothing.deleteMany();

  // Users
  const alice = await prisma.user.create({
    data: { username: "alice", email: "alice@example.com", password: "password123" },
  });

  const bob = await prisma.user.create({
    data: { username: "bob", email: "bob@example.com", password: "password123" },
  });

  const charlie = await prisma.user.create({
    data: { username: "charlie", email: "charlie@example.com", password: "password123" },
  });

  // Clothing
  const redJacket = await prisma.clothing.create({
    data: {
      name: "Red Jacket",
      category: "Jacket",
      ownerId: alice.id,
      images: { create: [{ url: "/example/red-jacket.jpg" }] },
    },
  });

  const blueTshirt = await prisma.clothing.create({
    data: {
      name: "Blue T-Shirt",
      category: "T-Shirt",
      ownerId: bob.id,
      images: { create: [{ url: "/example/blue-tshirt.jpg" }] },
    },
  });

  const greenSneakers = await prisma.clothing.create({
    data: {
      name: "Green Sneakers",
      category: "Shoes",
      ownerId: charlie.id,
      images: { create: [{ url: "/example/green-sneakers.jpg" }] },
    },
  });

  const blackHat = await prisma.clothing.create({
    data: {
      name: "Black Hat",
      category: "Accessories",
      ownerId: bob.id,
      images: { create: [{ url: "/example/black-hat.jpg" }] },
    },
  });

  // Matches
  await prisma.match.create({
    data: { userAId: alice.id, userBId: bob.id, clothingAId: redJacket.id, clothingBId: blueTshirt.id },
  });
  await prisma.match.create({
    data: { userAId: alice.id, userBId: bob.id, clothingAId: redJacket.id, clothingBId: blackHat.id },
  });
  await prisma.match.create({
    data: { userAId: alice.id, userBId: charlie.id, clothingAId: redJacket.id, clothingBId: greenSneakers.id },
  });

  console.log("✅ Seed data created successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
