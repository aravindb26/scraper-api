export enum ScraperQueue {
  BlocksEvents = "BlocksEvents",
  FillEvents = "FillEvents",
  FillEvents2 = "FillEvents2",
  SpeedUpEvents = "SpeedUpEvents",
  BlockNumber = "BlockNumber",
  TokenDetails = "TokenDetails",
  DepositReferral = "DepositReferral",
  RectifyStickyReferral = "RectifyStickyReferral",
  TokenPrice = "TokenPrice",
  DepositFilledDate = "DepositFilledDate",
  MerkleDistributorBlocksEvents = "MerkleDistributorBlocksEvents",
  DepositAcxPrice = "DepositAcxPrice",
  SuggestedFees = "SuggestedFees",
  TrackFillEvent = "TrackFillEvent",
  FeeBreakdown = "FeeBreakdown",
  OpRebateReward = "OpRebateReward",
}

export type BlocksEventsQueueMessage = {
  chainId: number;
  from: number;
  to: number;
};

export type MerkleDistributorBlocksEventsQueueMessage = {
  chainId: number;
  from: number;
  to: number;
};

export type FillEventsQueueMessage = {
  realizedLpFeePct: string;
  originChainId: number;
  depositId: number;
  totalFilledAmount: string;
  fillAmount: string;
  transactionHash: string;
  appliedRelayerFeePct: string;
  destinationToken: string;
};

export type FillEventsQueueMessage2 = {
  realizedLpFeePct: string;
  originChainId: number;
  depositId: number;
  totalFilledAmount: string;
  fillAmount: string;
  transactionHash: string;
  relayerFeePct: string;
  destinationToken: string;
};

export type SpeedUpEventsQueueMessage = {
  depositSourceChainId: number;
  depositId: number;
  depositor: string;
  depositorSignature: string;
  transactionHash: string;
  blockNumber: number;
  newRelayerFeePct: string;
  updatedRecipient?: string;
  updatedMessage?: string;
};

export type BlockNumberQueueMessage = {
  depositId: number;
};

export type TokenDetailsQueueMessage = {
  depositId: number;
};

export type DepositReferralQueueMessage = {
  depositId: number;
  rectifyStickyReferralAddress: boolean;
};

export type RectifyStickyReferralQueueMessage = {
  depositId: number;
};

export type TokenPriceQueueMessage = {
  depositId: number;
};

export type DepositFilledDateQueueMessage = {
  depositId: number;
};

export type DepositAcxPriceQueueMessage = {
  depositId: number;
};

export type SuggestedFeesQueueMessage = {
  depositId: number;
};

export type TrackFillEventQueueMessage = {
  depositId: number;
  fillTxHash: string;
  destinationToken: string;
};

export type FeeBreakdownQueueMessage = {
  depositId: number;
};

export type OpRebateRewardMessage = {
  depositPrimaryKey: number;
};
