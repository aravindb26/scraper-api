export type ChainId = number;

export const ChainIds = {
  mainnet: 1,
  optimism: 10,
  boba: 288,
  polygon: 137,
  arbitrum: 42161,
  goerli: 5,
  kovan: 42,
  rinkeby: 4,
  arbitrumRinkeby: 421611,
  optimismKovan: 69,
  polygonMumbai: 80001,
};

export type Web3Error = {
  error: {
    code: Web3ErrorCode;
  };
};

export enum Web3ErrorCode {
  BLOCK_RANGE_TOO_LARGE = -32005,
  EXCEEDED_MAXIMUM_BLOCK_RANGE = -32000,
  LOG_RESPONSE_SIZE_EXCEEDED = -32602,
}
