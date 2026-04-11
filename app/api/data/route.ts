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

    // Strategy: Safe Differential Sync (Bulk Write)
    // Avoids database-wipe race conditions and data loss risks on timeouts.

    
    // 1. User Settings (Upsert)
    await UserSettings.findOneAndUpdate(
      { userId },
      { 
        ultimateGoal: data.ultimateGoal || "",
        planningYears: JSON.stringify(data.planningYears || []) 
      },
      { upsert: true, new: true }
    );

    // Helper for simple bulk syncs
    const syncCollection = async (Model: any, incomingData: any[] = []) => {
      const incomingIds = incomingData.map(item => item.id);
      const bulkOps: any[] = incomingData.map(item => ({
        updateOne: {
          filter: { id: item.id, userId },
          update: { $set: { ...item, userId } },
          upsert: true
        }
      }));

      // Delete anything not in the new list
      bulkOps.push({
        deleteMany: {
          filter: { userId, id: { $nin: incomingIds } }
        }
      });
      await Model.bulkWrite(bulkOps);
    };

    // 2-6. Standard Collections
    await syncCollection(YearlyGoal, data.yearlyGoals);
    await syncCollection(MonthlyGoal, data.monthlyGoals);
    await syncCollection(RecurringTask, data.recurringTasks);
    await syncCollection(Note, data.notes);
    await syncCollection(WeeklyPlan, data.weeklyPlans);

    // 7. Daily Plans (Custom mapping)
    const incomingDaily = data.dailyPlans || [];
    const dailyIds = incomingDaily.map(p => p.id);
    const dailyBulkOps: any[] = incomingDaily.map(p => ({
        updateOne: {
            filter: { id: p.id, userId },
            update: { 
                $set: { 
                    ...p, 
                    userId,
                    reviewWhatDidIDo: p.review?.whatDidIDo || "",
                    reviewMovedFwd: p.review?.whatMovedForward || "",
                    reviewDidntWork: p.review?.whatDidntWork || "",
                    reviewFocusTmw: p.review?.focusForTomorrow || "",
                } 
            },
            upsert: true
        }
    }));
    dailyBulkOps.push({ deleteMany: { filter: { userId, id: { $nin: dailyIds } } } });
    await DailyPlan.bulkWrite(dailyBulkOps);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
