import { MembershipPlan, IMembershipPlan } from "../models/membershipPlan";
import { UserMembership, IUserMembership } from "../models/userMembership";
import { User } from "../models/user";
import mongoose from "mongoose";

export class MembershipService {
  // Get all available plans
  static async getAllPlans(): Promise<IMembershipPlan[]> {
    return await MembershipPlan.find({ isActive: true }).sort({ userType: 1, price: 1 });
  }

  // Get plans by user type
  static async getPlansByUserType(userType: "customer" | "contractor"): Promise<IMembershipPlan[]> {
    return await MembershipPlan.find({ userType, isActive: true }).sort({ price: 1 });
  }

  // Get user's current active membership
  static async getCurrentMembership(userId: string): Promise<IUserMembership | null> {
    return await UserMembership.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "active",
      endDate: { $gt: new Date() }
    }).populate("planId");
  }

  // Purchase a new membership (expires previous ones)
  static async purchaseMembership(
    userId: string, 
    planId: string
  ): Promise<{ membership: IUserMembership; expiredMemberships: IUserMembership[] }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the plan
      const plan = await MembershipPlan.findById(planId);
      if (!plan) {
        throw new Error("Membership plan not found");
      }

      // Verify user exists and get their role
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check if plan matches user type
      if (plan.userType !== user.role) {
        throw new Error(`This plan is for ${plan.userType}s only`);
      }

      // Expire all existing active memberships for this user
      const expiredMemberships = await UserMembership.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: "active"
      });

      await UserMembership.updateMany(
        {
          userId: new mongoose.Types.ObjectId(userId),
          status: "active"
        },
        {
          status: "expired",
          updatedAt: new Date()
        },
        { session }
      );

      // Create new membership
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (plan.duration * 24 * 60 * 60 * 1000));

      const newMembership = new UserMembership({
        userId: new mongoose.Types.ObjectId(userId),
        planId: new mongoose.Types.ObjectId(planId),
        status: "active",
        startDate,
        endDate,
        purchasePrice: plan.price,
        isAutoRenew: false
      });

      await newMembership.save({ session });
      await session.commitTransaction();

      // Populate the plan details
      await newMembership.populate("planId");

      console.log(`New membership created for user ${userId}: ${plan.name}`);
      console.log(`Expired ${expiredMemberships.length} previous memberships`);

      return {
        membership: newMembership,
        expiredMemberships
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Cancel current membership
  static async cancelMembership(userId: string): Promise<IUserMembership | null> {
    const membership = await UserMembership.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        status: "active"
      },
      {
        status: "canceled",
        updatedAt: new Date()
      },
      { new: true }
    ).populate("planId");

    return membership;
  }

  // Get user's membership history
  static async getMembershipHistory(userId: string): Promise<IUserMembership[]> {
    return await UserMembership.find({
      userId: new mongoose.Types.ObjectId(userId)
    })
    .populate("planId")
    .sort({ createdAt: -1 });
  }

  // Check and expire memberships (utility function)
  static async expireOldMemberships(): Promise<number> {
    const result = await UserMembership.updateMany(
      {
        status: "active",
        endDate: { $lt: new Date() }
      },
      {
        status: "expired",
        updatedAt: new Date()
      }
    );

    console.log(`Expired ${result.modifiedCount} old memberships`);
    return result.modifiedCount;
  }

  // Get membership stats for admin
  static async getMembershipStats() {
    const stats = await UserMembership.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$purchasePrice" }
        }
      }
    ]);

    const planStats = await UserMembership.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "membershipplans",
          localField: "planId", 
          foreignField: "_id",
          as: "plan"
        }
      },
      { $unwind: "$plan" },
      {
        $group: {
          _id: {
            userType: "$plan.userType",
            tier: "$plan.tier"
          },
          count: { $sum: 1 },
          revenue: { $sum: "$purchasePrice" }
        }
      }
    ]);

    return {
      statusStats: stats,
      planStats
    };
  }
}
