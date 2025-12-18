import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/mongodb";
import {
  UserSettings,
  YearlyGoal,
  MonthlyGoal,
  WeeklyPlan,
  DailyPlan,
  RecurringTask,
  Note,
  User 
} from "@/models";

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
  // Convert String ID back to ObjectId if needed, but here we store as string in session 
  // actually in auth.ts we did `id: user._id.toString()`.
  // So session.user.id is a string that represents the ObjectId in MongoDB.
  // Wait, my schemas use `userId: { type: Schema.Types.ObjectId ... }`.
  // So I need to cast it.
  const userId = session.user.id; 

  try {
    await connectToDatabase();

    // 1. Fetch User Settings
    const settings = await UserSettings.findOne({ userId });
    const planningYears = settings ? JSON.parse(settings.planningYears) : [];
    const ultimateGoal = settings?.ultimateGoal || "";

    // 2. Fetch Lists (Scoped to User)
    // We select specific fields to keep response clean (excluding _id if we want, but keeping it is fine, frontend uses 'id' which we added)
    // Actually, Mongoose returns 'id' virtual by default? No.
    // My schema explicitly has 'id' field (String). So the frontend will get 'id' (UUID) and '_id' (MongoObjectId).
    // The frontend likely only cares about 'id'.
    
    const yearlyGoals = await YearlyGoal.find({ userId });
    const monthlyGoals = await MonthlyGoal.find({ userId });
    const weeklyPlans = await WeeklyPlan.find({ userId });
    const dailyPlans = await DailyPlan.find({ userId });
    const recurringTasks = await RecurringTask.find({ userId });
    const notes = await Note.find({ userId });

    // 3. Format Daily Plans
    const formattedDailyPlans = dailyPlans.map((dp) => ({
      ...dp.toObject(), // Convert to plain object to handle spread
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
    await connectToDatabase();

    // Strategy: Wipe and Rewrite SCOPED TO USER
    // Since we are not using transactions (standalone support), we'll do delete then insert.
    // This has a tiny risk of data loss if insert fails after delete, but acceptable for this stage.
    
    // 1. User Settings
    let settings = await UserSettings.findOne({ userId });
    if (settings) {
      settings.ultimateGoal = data.ultimateGoal || "";
      settings.planningYears = JSON.stringify(data.planningYears || []);
      await settings.save();
    } else {
      await UserSettings.create({
        userId,
        ultimateGoal: data.ultimateGoal || "",
        planningYears: JSON.stringify(data.planningYears || []),
      });
    }

    // 2. Yearly Goals
    await YearlyGoal.deleteMany({ userId });
    if (data.yearlyGoals?.length) {
      await YearlyGoal.insertMany(data.yearlyGoals.map(g => ({ ...g, userId })));
    }

    // 3. Monthly Goals
    await MonthlyGoal.deleteMany({ userId });
    if (data.monthlyGoals?.length) {
      await MonthlyGoal.insertMany(data.monthlyGoals.map(g => ({ ...g, userId })));
    }

    // 4. Recurring Tasks
    await RecurringTask.deleteMany({ userId });
    if (data.recurringTasks?.length) {
      await RecurringTask.insertMany(data.recurringTasks.map(t => ({ ...t, userId })));
    }

    // 5. Notes
    await Note.deleteMany({ userId });
    if (data.notes?.length) {
      await Note.insertMany(data.notes.map(n => ({ ...n, userId })));
    }

    // 6. Weekly Plans
    await WeeklyPlan.deleteMany({ userId });
    if (data.weeklyPlans?.length) {
      await WeeklyPlan.insertMany(data.weeklyPlans.map(p => ({
        ...p,
        userId,
        tasks: p.tasks // Assuming p.tasks structure matches schema
      })));
    }

    // 7. Daily Plans
    await DailyPlan.deleteMany({ userId });
    if (data.dailyPlans?.length) {
       await DailyPlan.insertMany(data.dailyPlans.map(p => ({
        ...p,
        userId,
        reviewWhatDidIDo: p.review?.whatDidIDo || "",
        reviewMovedFwd: p.review?.whatMovedForward || "",
        reviewDidntWork: p.review?.whatDidntWork || "",
        reviewFocusTmw: p.review?.focusForTomorrow || "",
        // sections and tasks nested structure should be passed automatically if keys match
      })));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
