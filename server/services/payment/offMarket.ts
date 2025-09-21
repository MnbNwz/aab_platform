import { OffMarketPayment } from "@models/payment";
import { User } from "@models/user";
import { getOrCreateCustomer, createJobPaymentIntent } from "./stripe";
import { roundToCents } from "@utils/financial";
import { Types } from "@models/types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Create off-market payment
export async function createOffMarketPayment(
  listingId: string,
  contractorId: string,
  listingPrice: number,
  depositPercentage: number = 0.1,
) {
  try {
    const depositAmount = roundToCents(listingPrice * depositPercentage);

    const offMarketPayment = new OffMarketPayment({
      listingId,
      contractorId,
      listingPrice,
      depositAmount,
      status: "pending",
    });

    await offMarketPayment.save();

    const contractor = await User.findById(contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }

    const stripeCustomerId = await getOrCreateCustomer(contractorId.toString(), contractor.email);

    const paymentIntent = await createJobPaymentIntent(
      stripeCustomerId,
      depositAmount,
      listingId.toString(),
      "deposit",
    );

    offMarketPayment.depositPaymentIntentId = paymentIntent.id;
    await offMarketPayment.save();

    return {
      paymentIntent,
      offMarketPayment,
    };
  } catch (error) {
    console.error("Error creating off-market payment:", error);
    throw error;
  }
}

// Process off-market deposit payment
export async function processOffMarketDeposit(offMarketPaymentId: string) {
  try {
    const offMarketPayment = await OffMarketPayment.findById(offMarketPaymentId);
    if (!offMarketPayment) {
      throw new Error("Off-market payment not found");
    }

    if (offMarketPayment.status !== "pending") {
      throw new Error("Payment already processed");
    }

    // Update payment status
    offMarketPayment.status = "deposit_paid";
    offMarketPayment.depositPaidAt = new Date();
    await offMarketPayment.save();

    return offMarketPayment;
  } catch (error) {
    console.error("Error processing off-market deposit:", error);
    throw error;
  }
}

// Request financing for off-market property
export async function requestFinancing(
  offMarketPaymentId: string,
  financingDetails: {
    loanAmount: number;
    downPayment: number;
    loanTerm: number;
    interestRate: number;
    monthlyPayment: number;
  },
) {
  try {
    const offMarketPayment = await OffMarketPayment.findById(offMarketPaymentId);
    if (!offMarketPayment) {
      throw new Error("Off-market payment not found");
    }

    if (offMarketPayment.status !== "deposit_paid") {
      throw new Error("Deposit must be paid before requesting financing");
    }

    // Update payment with financing details
    offMarketPayment.financing = {
      isRequested: true,
      isApproved: false,
      approvedAmount: financingDetails.loanAmount,
      interestRate: financingDetails.interestRate,
      termMonths: financingDetails.loanTerm,
      underwritingStatus: "pending",
    };

    offMarketPayment.status = "deposit_paid"; // Keep as deposit_paid since financing_requested is not in enum
    await offMarketPayment.save();

    // Here you would typically integrate with a financing service
    // For now, we'll simulate approval after 24 hours
    setTimeout(
      async () => {
        offMarketPayment.financing!.isApproved = true;
        offMarketPayment.financing!.underwritingStatus = "approved";
        offMarketPayment.status = "financing_approved";
        await offMarketPayment.save();
      },
      24 * 60 * 60 * 1000,
    ); // 24 hours

    return offMarketPayment;
  } catch (error) {
    console.error("Error requesting financing:", error);
    throw error;
  }
}

// Process financing payment
export async function processFinancingPayment(offMarketPaymentId: string) {
  try {
    const offMarketPayment = await OffMarketPayment.findById(offMarketPaymentId);
    if (!offMarketPayment) {
      throw new Error("Off-market payment not found");
    }

    if (offMarketPayment.status !== "financing_approved") {
      throw new Error("Financing must be approved before processing payment");
    }

    if (!offMarketPayment.financing || !offMarketPayment.financing.isApproved) {
      throw new Error("Financing not approved");
    }

    // Create payment intent for remaining amount
    const remainingAmount = offMarketPayment.listingPrice - offMarketPayment.depositAmount;
    const contractor = await User.findById(offMarketPayment.contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }

    const stripeCustomerId = await getOrCreateCustomer(
      offMarketPayment.contractorId.toString(),
      contractor.email,
    );

    const paymentIntent = await createJobPaymentIntent(
      stripeCustomerId,
      remainingAmount,
      offMarketPayment.listingId.toString(),
      "completion",
    );

    // Update payment record
    offMarketPayment.financingPaymentIntentId = paymentIntent.id;
    offMarketPayment.status = "financing_approved"; // Keep as financing_approved since financing_payment_pending is not in enum
    await offMarketPayment.save();

    return {
      paymentIntent,
      offMarketPayment,
    };
  } catch (error) {
    console.error("Error processing financing payment:", error);
    throw error;
  }
}

// Process off-market refund
export async function processOffMarketRefund(
  offMarketPaymentId: string,
  amount: number,
  reason: string,
) {
  try {
    const offMarketPayment = await OffMarketPayment.findById(offMarketPaymentId);
    if (!offMarketPayment) {
      throw new Error("Off-market payment not found");
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: offMarketPayment.depositPaymentIntentId!,
      amount: amount,
      reason: "requested_by_customer",
      metadata: {
        offMarketPaymentId,
        reason,
      },
    });

    // Update payment status
    offMarketPayment.status = "refunded";
    offMarketPayment.refunds.push({
      amount: amount,
      reason,
      stripeRefundId: refund.id,
      processedAt: new Date(),
      adminFee: roundToCents(amount * 0.07), // 7% admin fee
      stripeFee: roundToCents(amount * 0.03), // 3% stripe fee
    });

    await offMarketPayment.save();

    return {
      refund,
      offMarketPayment,
    };
  } catch (error) {
    console.error("Error processing off-market refund:", error);
    throw error;
  }
}

// Get off-market payment history (optimized with aggregation)
export async function getOffMarketPaymentHistory(
  contractorId: string,
  page: number = 1,
  limit: number = 10,
) {
  try {
    const skip = (page - 1) * limit;

    // Optimized aggregation with enriched data
    const pipeline = [
      { $match: { contractorId: new Types.ObjectId(contractorId) } },

      // Add contractor details
      {
        $lookup: {
          from: "users",
          localField: "contractorId",
          foreignField: "_id",
          as: "contractor",
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                "contractor.company": 1,
              },
            },
          ],
        },
      },

      // Add payment statistics
      {
        $addFields: {
          contractor: { $arrayElemAt: ["$contractor", 0] },
          totalAmount: { $add: ["$listingPrice", "$depositAmount"] },
          isFinanced: { $ne: ["$financing", null] },
          financingStatus: "$financing.underwritingStatus",
        },
      },

      // Sort by creation date
      { $sort: { createdAt: -1 } },

      // Facet for pagination and count
      {
        $facet: {
          payments: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
          statistics: [
            {
              $group: {
                _id: null,
                totalListings: { $sum: 1 },
                totalValue: { $sum: "$listingPrice" },
                totalDeposits: { $sum: "$depositAmount" },
                avgListingPrice: { $avg: "$listingPrice" },
                financedListings: { $sum: { $cond: ["$isFinanced", 1, 0] } },
              },
            },
          ],
        },
      },
    ];

    const [result] = await OffMarketPayment.aggregate(pipeline as any);
    const payments = result.payments;
    const total = result.total[0]?.count || 0;
    const statistics = result.statistics[0] || {};

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics, // Additional insights for contractors
    };
  } catch (error) {
    console.error("Error getting off-market payment history:", error);
    throw error;
  }
}

// Get off-market payment details
export async function getOffMarketPaymentDetails(offMarketPaymentId: string) {
  try {
    const payment = await OffMarketPayment.findById(offMarketPaymentId);
    if (!payment) {
      throw new Error("Off-market payment not found");
    }

    return payment;
  } catch (error) {
    console.error("Error getting off-market payment details:", error);
    throw error;
  }
}

// Update financing status (admin function)
export async function updateFinancingStatus(
  offMarketPaymentId: string,
  status: "approved" | "rejected",
  notes?: string,
) {
  try {
    const offMarketPayment = await OffMarketPayment.findById(offMarketPaymentId);
    if (!offMarketPayment) {
      throw new Error("Off-market payment not found");
    }

    if (!offMarketPayment.financing) {
      throw new Error("No financing details found");
    }

    offMarketPayment.financing.underwritingStatus = status;
    offMarketPayment.financing.isApproved = status === "approved";

    if (status === "approved") {
      offMarketPayment.status = "financing_approved";
    } else {
      offMarketPayment.status = "cancelled"; // Use cancelled instead of financing_rejected
    }

    await offMarketPayment.save();

    return offMarketPayment;
  } catch (error) {
    console.error("Error updating financing status:", error);
    throw error;
  }
}

// Get financing statistics
export async function getFinancingStatistics(contractorId: string) {
  try {
    const stats = await OffMarketPayment.aggregate([
      { $match: { contractorId: new Types.ObjectId(contractorId) } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          totalValue: { $sum: "$listingPrice" },
          totalDeposits: { $sum: "$depositAmount" },
          approvedFinancing: {
            $sum: {
              $cond: [{ $eq: ["$financing.underwritingStatus", "approved"] }, 1, 0],
            },
          },
          pendingFinancing: {
            $sum: {
              $cond: [{ $eq: ["$financing.underwritingStatus", "pending"] }, 1, 0],
            },
          },
          rejectedFinancing: {
            $sum: {
              $cond: [{ $eq: ["$financing.underwritingStatus", "rejected"] }, 1, 0],
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalListings: 0,
        totalValue: 0,
        totalDeposits: 0,
        approvedFinancing: 0,
        pendingFinancing: 0,
        rejectedFinancing: 0,
      }
    );
  } catch (error) {
    console.error("Error getting financing statistics:", error);
    throw error;
  }
}
