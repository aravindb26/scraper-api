import { ViewEntity, ViewColumn, Unique } from "typeorm";

import { DepositReferralStats } from "../../referral/model/DepositReferralStats.entity";

@ViewEntity({
  dependsOn: [DepositReferralStats],
  materialized: true,
  expression: `
    SELECT
      d.id,
      d."depositId",
      d."depositTxHash",
      d."sourceChainId",
      d."destinationChainId",
      d.amount,
      t.symbol,
      t.decimals,
      d."depositorAddr",
      d."rewardsWindowIndex",
      case when d."rewardsWindowIndex" = c."windowIndex" and d."depositorAddr" = c.account then d."rewardsWindowIndex" else -1 end as "depositorClaimedWindowIndex",
      d2."referralClaimedWindowIndex",
      d."stickyReferralAddress" AS "referralAddress",
      d."depositDate",
      hmp.usd AS "tokenUsdPrice",
      (d."realizedLpFeePctCapped" / power(10, 18)) * (d.amount / power(10, t.decimals)) * hmp.usd AS "realizedLpFeeUsd",
      (d."bridgeFeePct" / power(10, 18)) * (d.amount / power(10, t.decimals)) * hmp.usd AS "bridgeFeeUsd",
      d."acxUsdPrice",
    CASE
      WHEN d1."referralCount" >= 20 OR d1."referralVolume" >= 500000 THEN 0.8
      WHEN d1."referralCount" >= 10 OR d1."referralVolume" >= 250000 THEN 0.7
      WHEN d1."referralCount" >= 5 OR d1."referralVolume" >= 100000 THEN 0.6
      WHEN d1."referralCount" >= 3 OR d1."referralVolume" >= 50000 THEN 0.5
      ELSE 0.4
    END AS "referralRate",
    CASE
      WHEN d."depositDate" < '2022-07-22 17:00:00' THEN 3
      WHEN d."depositDate" < '2022-12-13 00:00:00' THEN 2
      ELSE 1
    END AS multiplier
    FROM deposit d
    JOIN "deposit_referral_stat" d1 ON d."id" = d1."depositId"
    JOIN "deposits_filtered_referrals" d2 ON d."id" = d2."id"
    JOIN token t ON d."tokenId" = t.id
    JOIN historic_market_price hmp ON d."priceId" = hmp.id
    LEFT JOIN claim c on d."rewardsWindowIndex" = c."windowIndex" and c.account = d."depositorAddr"
    ORDER BY d."depositDate" desc;
  `,
})
@Unique("UK_deposits_mv_depositId_sourceChainId", ["depositId", "sourceChainId"])
export class DepositsMv {
  @ViewColumn()
  id: number;

  @ViewColumn()
  depositId: number;

  @ViewColumn()
  depositTxHash: string;

  @ViewColumn()
  sourceChainId: number;

  @ViewColumn()
  destinationChainId: number;

  @ViewColumn()
  amount: string;

  @ViewColumn()
  symbol: string;

  @ViewColumn()
  decimals: number;

  @ViewColumn()
  depositorAddr: string;

  @ViewColumn()
  referralAddress: string;

  @ViewColumn()
  referralRate: number;

  @ViewColumn()
  multiplier: number;

  @ViewColumn()
  rewardsWindowIndex: number;

  @ViewColumn()
  depositorClaimedWindowIndex: number;

  @ViewColumn()
  referralClaimedWindowIndex: number;

  @ViewColumn()
  depositDate: Date;

  @ViewColumn()
  tokenUsdPrice: string;

  @ViewColumn()
  realizedLpFeeUsd: string;

  @ViewColumn()
  bridgeFeeUsd: string;

  @ViewColumn()
  acxUsdPrice: string;
}

export class DepositsMvWithRewards extends DepositsMv {
  acxRewards: string;
}
