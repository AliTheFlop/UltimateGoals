import mongoose, { Schema, Model, models } from 'mongoose';

// --- User Schema ---
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  name: { type: String },
}, { timestamps: true });

// --- User Settings Schema ---
const userSettingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // One settings doc per user
  ultimateGoal: { type: String, default: '' },
  planningYears: { type: String, default: '[]' }, // JSON string of number[]
}, { timestamps: true });

// --- Yearly Goal Schema ---
const yearlyGoalSchema = new Schema({
  id: { type: String, required: true }, // UUID from frontend
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  specific: { type: String, default: '' },
  measurable: { type: String, default: '' },
  achievable: { type: String, default: '' },
  relevant: { type: String, default: '' },
  timeBound: { type: String, default: '' },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

// --- Monthly Goal Schema ---
const monthlyGoalSchema = new Schema({
  id: { type: String, required: true }, // UUID
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  month: { type: Number, required: true }, // 0-11
  year: { type: Number, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

// --- Weekly Plan Schema ---
const weeklyTaskSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  frequency: { type: String }, // "daily", "weekly", etc.
});

const weeklyPlanSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: String, required: true }, // ISO date string YYYY-MM-DD
  bigGoal: { type: String, default: '' },
  tasks: [weeklyTaskSchema],
}, { timestamps: true });

// Compound index for safer querying if we want unique plans per week per user
weeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

// --- Daily Plan Schema ---
const dailyTaskSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  frequency: { type: String },
  notes: { type: String, default: '' },
});

const dailySectionSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  tasks: [dailyTaskSchema],
});

const dailyPlanSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // ISO date string YYYY-MM-DD
  sections: [dailySectionSchema], // Sections contain tasks
  reviewWhatDidIDo: { type: String, default: '' },
  reviewMovedFwd: { type: String, default: '' },
  reviewDidntWork: { type: String, default: '' },
  reviewFocusTmw: { type: String, default: '' },
}, { timestamps: true });

dailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

// --- Recurring Task Schema ---
const recurringTaskSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  frequency: { type: String, required: true }, // "daily", "weekly", "monthly", "yearly"
  time: { type: String }, // HH:MM
}, { timestamps: true });

// --- Note Schema ---
const noteSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });


// Export Models (using mongoose.models.Name || mongoose.model('Name', schema) to prevent overwrite)
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const UserSettings = mongoose.models.UserSettings || mongoose.model('UserSettings', userSettingsSchema);
export const YearlyGoal = mongoose.models.YearlyGoal || mongoose.model('YearlyGoal', yearlyGoalSchema);
export const MonthlyGoal = mongoose.models.MonthlyGoal || mongoose.model('MonthlyGoal', monthlyGoalSchema);
export const WeeklyPlan = mongoose.models.WeeklyPlan || mongoose.model('WeeklyPlan', weeklyPlanSchema);
export const DailyPlan = mongoose.models.DailyPlan || mongoose.model('DailyPlan', dailyPlanSchema);
export const RecurringTask = mongoose.models.RecurringTask || mongoose.model('RecurringTask', recurringTaskSchema);
export const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
