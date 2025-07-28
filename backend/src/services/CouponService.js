const { supabase } = require("../utils/supabase");
const QlooService = require("./QlooService");

class CouponService {
  async matchAndIssueCoupon(donorId) {
    try {
      // Find matching coupons for the donor
      const { data: matchingCoupons, error: matchError } = await supabase.rpc(
        "match_donor_with_coupons",
        {
          p_donor_id: donorId,
        }
      );

      if (matchError) throw matchError;

      if (!matchingCoupons || matchingCoupons.length === 0) {
        return null; // No matching coupons found
      }

      const coupon = matchingCoupons[0];

      // Issue the coupon to the donor
      const { data: redemptionCode, error: issueError } = await supabase.rpc(
        "issue_coupon_to_donor",
        {
          p_donor_id: donorId,
          p_coupon_id: coupon.coupon_id,
        }
      );

      if (issueError) throw issueError;

      return {
        coupon: coupon,
        redemption_code: redemptionCode,
      };
    } catch (error) {
      console.error("Error matching and issuing coupon:", error);
      throw error;
    }
  }

  async getDonorCoupons(donorId) {
    const { data, error } = await supabase
      .from("DonorCoupons")
      .select(
        `
        *,
        Coupons!inner(
          partner_name,
          coupon_title,
          expiry_date
        )
      `
      )
      .eq("donor_id", donorId)
      .order("issued_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async redeemCoupon(redemptionCode) {
    try {
      // Find the coupon
      const { data: donorCoupon, error: findError } = await supabase
        .from("DonorCoupons")
        .select(
          `
          *,
          Coupons!inner(*)
        `
        )
        .eq("unique_redemption_code", redemptionCode)
        .eq("status", "Issued")
        .single();

      if (findError || !donorCoupon) {
        throw new Error("Invalid or already redeemed coupon code");
      }

      // Check if coupon is expired
      if (
        donorCoupon.Coupons.expiry_date &&
        new Date(donorCoupon.Coupons.expiry_date) < new Date()
      ) {
        throw new Error("Coupon has expired");
      }

      // Update coupon status to redeemed
      const { data, error } = await supabase
        .from("DonorCoupons")
        .update({ status: "Redeemed" })
        .eq("unique_redemption_code", redemptionCode)
        .select(
          `
          *,
          Coupons!inner(*),
          Donors!inner(
            Users!inner(full_name, email)
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      throw error;
    }
  }

  async createCoupon(couponData) {
    const { data, error } = await supabase
      .from("Coupons")
      .insert(couponData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllCoupons() {
    const { data, error } = await supabase
      .from("Coupons")
      .select("*")
      .order("coupon_id", { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateCoupon(couponId, updates) {
    const { data, error } = await supabase
      .from("Coupons")
      .update(updates)
      .eq("coupon_id", couponId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async issueCouponAfterDonation(donorId) {
    try {
      // Check if donor has recent donations (within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentDonations, error: donationError } = await supabase
        .from("Donations")
        .select("*")
        .eq("donor_id", donorId)
        .gte("donation_date", sevenDaysAgo.toISOString().split("T")[0]);

      if (donationError) throw donationError;

      if (recentDonations && recentDonations.length > 0) {
        return await this.matchAndIssueCoupon(donorId);
      }

      return null;
    } catch (error) {
      console.error("Error issuing coupon after donation:", error);
      throw error;
    }
  }
}

module.exports = new CouponService();
