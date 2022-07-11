import { ERC20__factory, SpokePool__factory } from "@across-protocol/contracts-v2";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ethers } from "ethers";
import { AppConfig } from "../../configuration/configuration.service";
import { Repository } from "typeorm";
import { Block } from "../model/block.entity";
import { ChainId } from "../model/ChainId";
import { Token } from "../model/token.entity";
import { SpokePoolEventsQuerier } from "./SpokePoolEventsQuerier";
import { Transaction } from "../model/transaction.entity";

@Injectable()
export class EthProvidersService {
  private providers: Record<string, ethers.providers.JsonRpcProvider> = {};
  private spokePoolEventQueriers: Record<string, SpokePoolEventsQuerier> = {};

  public constructor(
    private appConfig: AppConfig,
    @InjectRepository(Block) private blockRepository: Repository<Block>,
    @InjectRepository(Token) private tokenRepository: Repository<Token>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
  ) {
    const supportedChainIds = Object.keys(this.appConfig.values.web3.providers);

    for (const chainId of supportedChainIds) {
      if (this.appConfig.values.web3.providers[chainId]) {
        const provider = new ethers.providers.JsonRpcProvider(this.appConfig.values.web3.providers[chainId]);
        this.providers[chainId] = provider;
      }
    }

    for (const chainId of Object.keys(this.getProviders())) {
      const spokePool = SpokePool__factory.connect(
        appConfig.values.web3.spokePoolContracts[parseInt(chainId)].address,
        this.getProvider(parseInt(chainId)),
      );
      this.spokePoolEventQueriers[chainId] = new SpokePoolEventsQuerier(spokePool);
    }
  }

  public getProvider(chainId: ChainId): ethers.providers.JsonRpcProvider | undefined {
    return this.providers[chainId];
  }

  public getProviders() {
    return this.providers;
  }

  public getSpokePoolEventQuerier(chainId: ChainId): SpokePoolEventsQuerier | undefined {
    return this.spokePoolEventQueriers[chainId];
  }

  public getSpokePoolEventQueriers() {
    return this.spokePoolEventQueriers;
  }

  public async getCachedBlock(chainId: number, blockNumber: number) {
    let block = await this.blockRepository.findOne({ where: { chainId, blockNumber } });

    if (!block) {
      const web3Block = await this.getProvider(chainId).getBlock(blockNumber);
      block = this.blockRepository.create({
        chainId,
        blockNumber,
        date: new Date(web3Block.timestamp * 1000).toISOString(),
      });
      block = await this.blockRepository.save(block);
    }

    return block;
  }

  public async getCachedToken(chainId: number, tokenAddr: string) {
    let token = await this.tokenRepository.findOne({ where: { chainId, address: tokenAddr } });

    if (!token) {
      const tokenContract = ERC20__factory.connect(tokenAddr, this.getProvider(chainId));
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);
      token = this.tokenRepository.create({
        address: tokenAddr,
        chainId,
        name,
        symbol,
        decimals,
      });
      token = await this.tokenRepository.save(token);
    }

    return token;
  }

  public async getCachedTransaction(chainId: number, hash: string) {
    let transaction = await this.transactionRepository.findOne({ where: { chainId, hash } });

    if (!transaction) {
      const web3Transaction = await this.getProvider(chainId).getTransaction(hash);
      const { data, blockNumber } = web3Transaction;
      transaction = this.transactionRepository.create({
        chainId,
        data,
        hash,
        blockNumber,
      });
      transaction = await this.transactionRepository.save(transaction);
    }

    return transaction;
  }
}
