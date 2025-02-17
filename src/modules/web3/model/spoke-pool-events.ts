import { BigNumber, Event } from "ethers";

export interface FundsDepositedEvent2 extends Event {
  args: [BigNumber, BigNumber, BigNumber, BigNumber, number, number, string, string, string] & {
    amount: BigNumber;
    originChainId: BigNumber;
    destinationChainId: BigNumber;
    relayerFeePct: BigNumber;
    depositId: number;
    quoteTimestamp: number;
    originToken: string;
    recipient: string;
    depositor: string;
  };
}

export interface FundsDepositedEvent2_5 extends Event {
  args: [BigNumber, BigNumber, BigNumber, BigNumber, number, number, string, string, string, string] & {
    amount: BigNumber;
    originChainId: BigNumber;
    destinationChainId: BigNumber;
    relayerFeePct: BigNumber;
    depositId: number;
    quoteTimestamp: number;
    originToken: string;
    recipient: string;
    depositor: string;
    message: string;
  };
}

export interface FilledRelayEvent2 extends Event {
  args: [
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    number,
    string,
    string,
    string,
    string,
    boolean,
  ] & {
    amount: BigNumber;
    totalFilledAmount: BigNumber;
    fillAmount: BigNumber;
    repaymentChainId: BigNumber;
    originChainId: BigNumber;
    destinationChainId: BigNumber;
    relayerFeePct: BigNumber;
    appliedRelayerFeePct: BigNumber;
    realizedLpFeePct: BigNumber;
    depositId: number;
    destinationToken: string;
    relayer: string;
    depositor: string;
    recipient: string;
    isSlowRelay: boolean;
  };
}

export interface FilledRelayEvent2_5 extends Event {
  args: [
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    number,
    string,
    string,
    string,
    string,
    string,
    [string, string, BigNumber, boolean, BigNumber] & {
      recipient: string;
      message: string;
      relayerFeePct: BigNumber;
      isSlowRelay: boolean;
      payoutAdjustmentPct: BigNumber;
    },
  ] & {
    amount: BigNumber;
    totalFilledAmount: BigNumber;
    fillAmount: BigNumber;
    repaymentChainId: BigNumber;
    originChainId: BigNumber;
    destinationChainId: BigNumber;
    relayerFeePct: BigNumber;
    realizedLpFeePct: BigNumber;
    depositId: number;
    destinationToken: string;
    relayer: string;
    depositor: string;
    recipient: string;
    message: string;
    updatableRelayData: [string, string, BigNumber, boolean, BigNumber] & {
      recipient: string;
      message: string;
      relayerFeePct: BigNumber;
      isSlowRelay: boolean;
      payoutAdjustmentPct: BigNumber;
    };
  };
}

export interface RequestedSpeedUpDepositEvent2 extends Event {
  args: [BigNumber, number, string, string] & {
    newRelayerFeePct: BigNumber;
    depositId: number;
    depositor: string;
    depositorSignature: string;
  };
}

export interface RequestedSpeedUpDepositEvent2_5 extends Event {
  args: [BigNumber, number, string, string, string, string] & {
    newRelayerFeePct: BigNumber;
    depositId: number;
    depositor: string;
    updatedRecipient: string;
    updatedMessage: string;
    depositorSignature: string;
  };
}

export interface RefundRequestedEvent2_5 extends Event {
  args: [string, string, BigNumber, BigNumber, BigNumber, BigNumber, number, BigNumber, BigNumber] & {
    relayer: string;
    refundToken: string;
    amount: BigNumber;
    originChainId: BigNumber;
    destinationChainId: BigNumber;
    realizedLpFeePct: BigNumber;
    depositId: number;
    fillBlock: BigNumber;
    previousIdenticalRequests: BigNumber;
  };
}
