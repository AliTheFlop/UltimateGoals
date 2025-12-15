import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// TYPE DEFINITIONS
type IncomingData = {
  ultimateGoal?: string;
  planningYears?: number[];
  yearlyGoals?: any[];
  monthlyGoals?: any[];
  weeklyPlans?: any[];
  dailyPlans?: any[];
  recurringTasks?: any[];
  notes?: any[];
};

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 1. Fetch User Settings
    const settings = await prisma.userSettings.findFirst({
        where: { userId }
    });
    const planningYears = settings ? JSON.parse(settings.planningYears) : [];
    const ultimateGoal = settings?.ultimateGoal || "";

    // 2. Fetch Lists (Scoped to User)
    const yearlyGoals = await prisma.yearlyGoal.findMany({ where: { userId } });
    const monthlyGoals = await prisma.monthlyGoal.findMany({ where: { userId } });
    const weeklyPlans = await prisma.weeklyPlan.findMany({
      where: { userId },
      include: { tasks: true },
    });
    const dailyPlans = await prisma.dailyPlan.findMany({
      where: { userId },
      include: {
        sections: {
          include: { tasks: true },
        },
      },
    });
    const recurringTasks = await prisma.recurringTask.findMany({ where: { userId } });
    const notes = await prisma.note.findMany({ where: { userId } });

    // 3. Format Daily Plans
    const formattedDailyPlans = dailyPlans.map((dp) => ({
      ...dp,
      review:
        dp.reviewWhatDidIDo || dp.reviewMovedFwd || dp.reviewDidntWork
          ? {
              whatDidIDo: dp.reviewWhatDidIDo,
              whatMovedForward: dp.reviewMovedFwd,
              whatDidntWork: dp.reviewDidntWork,
              focusForTomorrow: dp.reviewFocusTmw,
            }
          : undefined,
    }));

    // 4. Construct Response
    return NextResponse.json({
      planningYears,
      ultimateGoal,
      yearlyGoals,
      monthlyGoals,
      weeklyPlans,
      dailyPlans: formattedDailyPlans,
      recurringTasks,
      notes,
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const data: IncomingData = await request.json();

    // Transaction to ensure consistency
    // Strategy: Wipe and Rewrite SCOPED TO USER
    await prisma.$transaction(async (tx) => {
      // 1. User Settings
      const existingSettings = await tx.userSettings.findFirst({ where: { userId } });
      if (existingSettings) {
        await tx.userSettings.update({
          where: { id: existingSettings.id },
          data: {
            ultimateGoal: data.ultimateGoal || "",
            planningYears: JSON.stringify(data.planningYears || []),
          },
        });
      } else {
        await tx.userSettings.create({
          data: {
            userId,
            ultimateGoal: data.ultimateGoal || "",
            planningYears: JSON.stringify(data.planningYears || []),
          },
        });
      }

      // 2. Yearly Goals
      await tx.yearlyGoal.deleteMany({ where: { userId } });
      if (data.yearlyGoals?.length) {
        await tx.yearlyGoal.createMany({
          data: data.yearlyGoals.map((g) => ({
            id: g.id,
            userId,
            year: g.year,
            specific: g.specific,
            measurable: g.measurable,
            achievable: g.achievable,
            relevant: g.relevant,
            timeBound: g.timeBound,
            completed: g.completed,
          })),
        });
      }

      // 3. Monthly Goals
      await tx.monthlyGoal.deleteMany({ where: { userId } });
      if (data.monthlyGoals?.length) {
        await tx.monthlyGoal.createMany({
          data: data.monthlyGoals.map((g) => ({
            id: g.id,
            userId,
            text: g.text,
            month: g.month,
            year: g.year,
            completed: g.completed,
          })),
        });
      }

      // 4. Recurring Tasks
      await tx.recurringTask.deleteMany({ where: { userId } });
      if (data.recurringTasks?.length) {
        await tx.recurringTask.createMany({
          data: data.recurringTasks.map((t) => ({
            id: t.id,
            userId,
            text: t.text,
            frequency: t.frequency,
            time: t.time,
          })),
        });
      }

      // 5. Notes
      await tx.note.deleteMany({ where: { userId } });
      if (data.notes?.length) {
        await tx.note.createMany({
          data: data.notes.map((n) => ({
            id: n.id,
            userId,
            title: n.title,
            content: n.content,
            createdAt: n.createdAt ? new Date(n.createdAt) : undefined,
          })),
        });
      }

      // 6. Weekly Plans
      await tx.weeklyPlan.deleteMany({ where: { userId } });
      if (data.weeklyPlans?.length) {
        for (const plan of data.weeklyPlans) {
          await tx.weeklyPlan.create({
            data: {
              id: plan.id,
              userId,
              weekStart: plan.weekStart,
              bigGoal: plan.bigGoal,
              tasks: {
                create: plan.tasks?.map((t: any) => ({
                  id: t.id,
                  text: t.text,
                  completed: t.completed,
                  frequency: t.frequency,
                })),
              },
            },
          });
        }
      }

      // 7. Daily Plans
      await tx.dailyPlan.deleteMany({ where: { userId } });
      if (data.dailyPlans?.length) {
        for (const plan of data.dailyPlans) {
          await tx.dailyPlan.create({
            data: {
              id: plan.id,
              userId,
              date: plan.date,
              reviewWhatDidIDo: plan.review?.whatDidIDo || "",
              reviewMovedFwd: plan.review?.whatMovedForward || "",
              reviewDidntWork: plan.review?.whatDidntWork || "",
              reviewFocusTmw: plan.review?.focusForTomorrow || "",
              sections: {
                create: plan.sections?.map((s: any) => ({
                  id: s.id,
                  title: s.title,
                  tasks: {
                    create: s.tasks?.map((t: any) => ({
                      id: t.id,
                      text: t.text,
                      completed: t.completed,
                      frequency: t.frequency,
                    })),
                  },
                })),
              },
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
