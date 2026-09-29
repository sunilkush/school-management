import { SchoolSubscription } from "../models/schoolSubscription.model.js";
// Imported so populating planId below works whoever calls this, rather than relying on some other
// module having registered the plan model first.
import "../models/SubscriptionPlan.model.js";

/**
 * Marks a subscription expired if its end date has passed — but only if it still has.
 *
 * Both "fetch my subscription" endpoints do this on a plain GET, and they used to read the
 * subscription, decide it had run out and save. A school paying at the moment its plan ran out
 * lost: the payment extended the end date and set the plan active, and the read that had already
 * decided it was expired then saved "expired" over it. Nothing marks a plan active again on a
 * read, so the school stayed locked out of a plan it had just paid for until a Super Admin
 * stepped in.
 *
 * The end date is now checked again as part of the write, so a payment that lands first simply
 * means this finds nothing to expire.
 *
 * Returns the subscription to send back: the expired one if it was expired here, otherwise the
 * one that was passed in.
 */
export const expireIfElapsed = async (subscription) => {
  if (!subscription) return subscription;
  if (!["active", "trial"].includes(subscription.status)) return subscription;
  if (new Date(subscription.endDate) >= new Date()) return subscription;

  const expired = await SchoolSubscription.findOneAndUpdate(
    {
      _id: subscription._id,
      status: { $in: ["active", "trial"] },
      endDate: { $lt: new Date() },
    },
    { $set: { status: "expired" } },
    { new: true }
  ).populate("planId");

  // Nothing matched, so something changed between the read and here: the plan was paid for or
  // renewed, or another request expired it first. Either way the copy we were handed is out of
  // date — returning it would report a plan as still running after it had just been expired —
  // so read what it actually says now.
  return expired || (await SchoolSubscription.findById(subscription._id).populate("planId")) || subscription;
};
