import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// TYPE DEFINITIONS (Matching DataContext)
// We need these to type the incoming body
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
  try {
    // 1. Fetch Global Settings
    const settings = await prisma.globalSettings.findFirst();
    const planningYears = settings ? JSON.parse(settings.planningYears) : [];
    const ultimateGoal = settings?.ultimateGoal || "";

    // 2. Fetch Lists
    const yearlyGoals = await prisma.yearlyGoal.findMany();
    const monthlyGoals = await prisma.monthlyGoal.findMany();
    const weeklyPlans = await prisma.weeklyPlan.findMany({
      include: { tasks: true },
    });
    const dailyPlans = await prisma.dailyPlan.findMany({
      include: {
        sections: {
          include: { tasks: true },
        },
      },
    });
    const recurringTasks = await prisma.recurringTask.findMany();
    const notes = await prisma.note.findMany();

    // 3. Format Daily Plans to match Frontend Structure
    // Prisma returns sections -> tasks. Frontend expects sections -> tasks. This matches.
    // However, we need to map the "review" fields from columns to an object if needed?
    // In schema: reviewWhatDidIDo, etc.
    // In context: review?: { whatDidIDo: string, ... }
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
  try {
    const data: IncomingData = await request.json();

    // Transaction to ensure consistency
    // Strategy: Wipe and Rewrite (simplest for full sync behavior)
    // In production with many users this is bad. For local single-user, it's fine and robust.
    await prisma.$transaction(async (tx) => {
      // 1. Global Settings
      // Check if exists, update or create
      const existingSettings = await tx.globalSettings.findFirst();
      if (existingSettings) {
        await tx.globalSettings.update({
          where: { id: existingSettings.id },
          data: {
            ultimateGoal: data.ultimateGoal || "",
            planningYears: JSON.stringify(data.planningYears || []),
          },
        });
      } else {
        await tx.globalSettings.create({
          data: {
            ultimateGoal: data.ultimateGoal || "",
            planningYears: JSON.stringify(data.planningYears || []),
          },
        });
      }

      // 2. Yearly Goals
      await tx.yearlyGoal.deleteMany(); // Clear old
      if (data.yearlyGoals?.length) {
        await tx.yearlyGoal.createMany({
          data: data.yearlyGoals.map((g) => ({
            id: g.id,
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
      await tx.monthlyGoal.deleteMany();
      if (data.monthlyGoals?.length) {
        await tx.monthlyGoal.createMany({
          data: data.monthlyGoals.map((g) => ({
            id: g.id,
            text: g.text,
            month: g.month,
            year: g.year,
            completed: g.completed,
          })),
        });
      }

      // 4. Recurring Tasks
      await tx.recurringTask.deleteMany();
      if (data.recurringTasks?.length) {
        await tx.recurringTask.createMany({
          data: data.recurringTasks.map((t) => ({
            id: t.id,
            text: t.text,
            frequency: t.frequency,
            time: t.time,
          })),
        });
      }

      // 5. Notes
      await tx.note.deleteMany();
      if (data.notes?.length) {
        await tx.note.createMany({
          data: data.notes.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            createdAt: n.createdAt ? new Date(n.createdAt) : undefined, // parsing/keeping ISO
          })),
        });
      }

      // 6. Weekly Plans (Nested)
      // Delete all weekly plans (cascades to tasks)
      await tx.weeklyPlan.deleteMany();
      if (data.weeklyPlans?.length) {
        for (const plan of data.weeklyPlans) {
          await tx.weeklyPlan.create({
            data: {
              id: plan.id,
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

      // 7. Daily Plans (Doubly Nested)
      // Delete all daily plans (cascades to sections -> tasks)
      await tx.dailyPlan.deleteMany();
      if (data.dailyPlans?.length) {
        for (const plan of data.dailyPlans) {
          await tx.dailyPlan.create({
            data: {
              id: plan.id,
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
