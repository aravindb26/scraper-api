export const getReferralsQuery = () => {
  return `
    select
      *,
      case
        when d."depositorAddr" = $1 and d."referralAddress" = $1
          then trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * power(10, 18) * d.multiplier as decimal))
        when d."depositorAddr" = $1
        then trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * 0.25 * power(10, 18) * d.multiplier as decimal))
        else trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * 0.75 * power(10, 18) * d.multiplier as decimal))
      end as "acxRewards"
    from deposits_mv as d
    where d."referralAddress" = $1 or
    (d."depositorAddr" = $1 and d."referralAddress" is not null)
    order by d."depositDate" DESC
    limit $2
    offset $3;
  `;
};

export const getReferralsByDepositIdsQuery = () => {
  return `
    select
      *,
      case
        when d."depositorAddr" = $1 and d."referralAddress" = $1
          then trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * power(10, 18) * d.multiplier as decimal))
        when d."depositorAddr" = $1
        then trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * 0.25 * power(10, 18) * d.multiplier as decimal))
        else trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * 0.75 * power(10, 18) * d.multiplier as decimal))
      end as "acxRewards"
    from deposits_mv as d
    where d.id = ANY($2);
  `;
};

export const getReferralsTotalQuery = () => {
  return `
    select count(*)
    from deposits_mv as d
    where d."referralAddress" = $1 or
    (d."depositorAddr" = $1 and d."referralAddress" is not null)
  `;
};

export const getTotalReferralRewardsQuery = () => {
  return `
    select
      sum(
        case
          when d."depositorAddr" = $1 and d."referralAddress" = $1
            then trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * power(10, 18) * d.multiplier as decimal))
          when d."depositorAddr" = $1
          then trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * 0.25 * power(10, 18) * d.multiplier as decimal))
          else trunc(cast(d."bridgeFeeUsd" * d."referralRate" / d."acxUsdPrice" * 0.75 * power(10, 18) * d.multiplier as decimal))
        end
      ) as "acxRewards"
    from deposits_mv as d
    where (d."referralAddress" = $1 and d."referralClaimedWindowIndex" = -1) or (d."depositorAddr" = $1 and d."depositorClaimedWindowIndex" = -1);  
  `;
};

export const getReferreeWalletsQuery = () => {
  return `select count(*) from (
    select distinct on (d."depositorAddr") d."depositorAddr"
    from deposits_mv as d
    where d."referralAddress" = $1 and d."referralClaimedWindowIndex" = -1
  ) t`;
};

export const getReferralTransfersQuery = () => {
  return `select count(*)
    from deposits_mv as d
    where d."referralAddress" = $1 and d."referralClaimedWindowIndex" = -1`;
};

export const getReferralVolumeQuery = () => {
  return `
    select coalesce(sum(d.amount / power(10, d.decimals) * d."tokenUsdPrice"), 0) as volume
    from deposits_mv as d
    where d."referralAddress" = $1 and d."referralClaimedWindowIndex" = -1`;
};

export const getActiveRefereesCountQuery = () => {
  return `
    select count(*)
    from (
        select d."depositorAddr", d."depositDate", d."referralAddress", row_number() over (partition by d."depositorAddr" order by d."depositDate" desc) r
        from deposits_mv as d
        where d."referralClaimedWindowIndex" = -1
    ) temp
    where temp.r = 1 and temp."referralAddress" = $1;
  `;
};

export const updateStickyReferralAddressesQuery = () => {
  return `
    update deposit
    set "stickyReferralAddress" = d1."referralAddress"
    from (
      -- for each deposit get the previous not null referral addresses from which only the first one will be chosen
      select 
        d3.id,
        d4."referralAddress",
        ROW_NUMBER() OVER (
          PARTITION BY d3."id"
          order by d4."depositDate" desc
        ) as "rowNumber"
      from deposit d3
      inner join deposit d4
        on d3."depositorAddr" = d4."depositorAddr" and d3."depositDate" >= d4."depositDate" and 
          d4."referralAddress" is not null
      order by d3."depositDate" desc, d4."depositDate" desc
    ) d1
    where deposit.id = d1.id and d1."rowNumber" = 1;  
  `;
};

export const getRefreshMaterializedView = () => {
  return `REFRESH MATERIALIZED VIEW deposits_mv`;
};
