const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');

  // 1. Create Default User
  const username = "fishslayer27";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.log(`Creating user: ${username}`);
    user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: "Fish Slayer",
      },
    });
  } else {
    console.log(`User ${username} already exists.`);
  }

  const userId = user.id;

  // 2. Assign Orphan Data to User
  console.log(`Assigning data to userId: ${userId}`);

  // Helper to update if userId is null
  const updateModel = async (modelName, model) => {
    const { count } = await model.updateMany({
      where: { userId: null },
      data: { userId },
    });
    console.log(`Updated ${count} ${modelName} records.`);
  };

  await updateModel('UserSettings', prisma.userSettings); // Note: Previous GlobalSettings data was dropped, so this will be 0 or new
  await updateModel('YearlyGoal', prisma.yearlyGoal);
  await updateModel('MonthlyGoal', prisma.monthlyGoal);
  await updateModel('WeeklyPlan', prisma.weeklyPlan);
  await updateModel('DailyPlan', prisma.dailyPlan);
  await updateModel('RecurringTask', prisma.recurringTask);
  await updateModel('Note', prisma.note);

  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
