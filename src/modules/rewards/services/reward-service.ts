import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";

import { Deposit } from "../../deposit/model/deposit.entity";
import { formatDeposit } from "../../deposit/utils";
import { DepositsMvWithRewards } from "../../deposit/model/DepositsMv.entity";
import { ReferralService } from "../../referral/services/service";
import { assertValidAddress } from "../../../utils";

import { OpRebateService } from "./op-rebate-service";
import { Reward } from "../model/reward.entity";
import { GetRewardsQuery, GetSummaryQuery, GetReferralRewardsSummaryQuery } from "../entrypoints/http/dto";

@Injectable()
export class RewardService {
  constructor(
    @InjectRepository(Deposit) readonly depositRepository: Repository<Deposit>,
    @InjectRepository(Reward) readonly rewardRepository: Repository<Reward>,
    private referralService: ReferralService,
    private opRebateService: OpRebateService,
  ) {}

  public async getEarnedRewards(query: GetSummaryQuery) {
    const { userAddress } = query;
    const [opRewards, referralRewards] = await Promise.all([
      this.opRebateService.getEarnedRewards(userAddress),
      this.referralService.getEarnedRewards(userAddress),
    ]);

    return {
      "op-rebates": opRewards,
      referrals: referralRewards,
    };
  }

  public async getOpRebateRewardDeposits(query: GetRewardsQuery) {
    const { rewards, pagination } = await this.opRebateService.getOpRebateRewards(query);
    return {
      deposits: rewards.map((reward) => ({
        ...formatDeposit(reward.deposit),
        rewards: this.formatOpRebate(reward),
      })),
      pagination,
    };
  }

  public async getOpRebatesSummary(query: GetSummaryQuery) {
    return this.opRebateService.getOpRebatesSummary(query.userAddress);
  }

  public async getReferralRewardDeposits(query: GetRewardsQuery) {
    const { referrals, pagination } = await this.referralService.getReferralsWithJoinedDeposit(
      query.userAddress,
      parseInt(query.limit || "10"),
      parseInt(query.offset || "0"),
    );
    return {
      deposits: referrals.map((referral) => ({
        ...formatDeposit(referral.deposit),
        rewards: this.formatReferral(referral, query.userAddress),
      })),
      pagination,
    };
  }

  public async getReferralRewardsSummary(query: GetReferralRewardsSummaryQuery) {
    return this.referralService.getReferralSummaryHandler({
      ...query,
      address: query.userAddress,
    });
  }

  public async getRewardsForDepositsAndUserAddress(deposits: Deposit[], userAddress: string) {
    const depositPrimaryKeys = deposits.map((deposit) => deposit.id);
    const [opRebateRewards, referralRewards] = await Promise.all([
      this.opRebateService.getOpRebateRewardsForDepositPrimaryKeys(depositPrimaryKeys),
      this.referralService.getReferralsForDepositsAndUserAddress(depositPrimaryKeys, userAddress),
    ]);
    return {
      "op-rebates": opRebateRewards,
      referrals: referralRewards,
    };
  }

  public enrichDepositsWithRewards(
    userAddress: string,
    deposits: Deposit[],
    rewards: {
      "op-rebates": Reward[];
      referrals: DepositsMvWithRewards[];
    },
  ) {
    return deposits.map((deposit) => {
      const opRebate = rewards["op-rebates"].find((reward) => reward.depositPrimaryKey === deposit.id);
      const referral = rewards["referrals"].find((reward) => reward.id === deposit.id);

      return {
        deposit,
        // We assume that a deposit can only have one type of reward here. If this changes in the future for
        // other types of rewards, we will need to change this logic.
        rewards: opRebate
          ? this.formatOpRebate(opRebate)
          : referral
          ? this.formatReferral(referral, userAddress)
          : undefined,
      };
    });
  }

  public formatOpRebate(reward: Reward) {
    return {
      type: "op-rebates",
      rate: reward.metadata.rate,
      amount: reward.amount,
      usd: reward.amountUsd,
    };
  }

  public formatReferral(referral: DepositsMvWithRewards, userAddress: string) {
    userAddress = assertValidAddress(userAddress);
    const userRate =
      referral.depositorAddr === userAddress && referral.referralAddress === userAddress
        ? 1
        : referral.depositorAddr === userAddress
        ? 0.25
        : 0.75;
    return {
      type: "referrals",
      tier: this.referralService.getTierLevelByRate(referral.referralRate),
      rate: new BigNumber(userRate).multipliedBy(referral.referralRate).multipliedBy(referral.multiplier).toNumber(),
      userRate,
      referralRate: Number(referral.referralRate),
      multiplier: referral.multiplier,
      amount: referral.acxRewards,
      usd: new BigNumber(referral.acxUsdPrice)
        .multipliedBy(ethers.utils.formatUnits(referral.acxRewards, 18))
        .toFixed(),
    };
  }
}
