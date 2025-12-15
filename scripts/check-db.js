const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = 'fishslayer27';
  const user = await prisma.user.findUnique({ where: { username } });
  
  if (!user) {
    console.log(`User ${username} not found.`);
    return;
  }
  
  console.log(`User ID: ${user.id}`);
  
  const yearly = await prisma.yearlyGoal.count({ where: { userId: user.id } });
  const weekly = await prisma.weeklyPlan.count({ where: { userId: user.id } });
  const daily = await prisma.dailyPlan.count({ where: { userId: user.id } });
  const notes = await prisma.note.count({ where: { userId: user.id } });
  const settings = await prisma.userSettings.count({ where: { userId: user.id } });

  console.log('--- Counts ---');
  console.log(`Yearly Goals: ${yearly}`);
  console.log(`Weekly Plans: ${weekly}`);
  console.log(`Daily Plans: ${daily}`);
  console.log(`Notes: ${notes}`);
  console.log(`Settings: ${settings}`);

  // Check valid session
  // We can't easily check session validity here without the secret, but existence of data confirms DB state.
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
