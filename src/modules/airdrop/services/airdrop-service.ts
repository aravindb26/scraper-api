import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ethers } from "ethers";
import { readFile } from "fs/promises";
import BigNumber from "bignumber.js";
import { IsNull, Not, Repository } from "typeorm";

import { UserService } from "../../user/services/user.service";
import { UserWalletService } from "../../user/services/user-wallet.service";

import { Deposit } from "../../scraper/model/deposit.entity";
import { CommunityRewards } from "../model/community-rewards.entity";
import { WalletRewards } from "../model/wallet-rewards.entity";

import { ProcessCommunityRewardsFileException, ProcessWalletRewardsFileException } from "./exceptions";

@Injectable()
export class AirdropService {
  private logger = new Logger(AirdropService.name);

  constructor(
    @InjectRepository(CommunityRewards) private communityRewardsRepository: Repository<CommunityRewards>,
    @InjectRepository(WalletRewards) private walletRewardsRepository: Repository<WalletRewards>,
    @InjectRepository(Deposit) private depositRepository: Repository<Deposit>,
    private userWalletService: UserWalletService,
    private userService: UserService,
  ) {}

  public async getRewards(walletAddress: string) {
    const checksumAddress = ethers.utils.getAddress(walletAddress);
    const walletRewards = await this.getWalletRewards(checksumAddress);
    const communityRewards: string = await this.getCommunityRewards(checksumAddress);
    const welcomeTravellerEligible = !!walletRewards && new BigNumber(walletRewards.welcomeTravellerRewards).gt(0);
    let welcomeTravellerCompleted = false;

    if (welcomeTravellerEligible) {
      const depositCount = await this.depositRepository.count({
        where: { depositorAddr: checksumAddress, status: "filled" },
      });

      if (depositCount > 0) {
        welcomeTravellerCompleted = true;
      }
    }

    return {
      welcomeTravellerRewards: {
        eligible: welcomeTravellerEligible,
        completed: welcomeTravellerCompleted,
        amount: walletRewards?.welcomeTravellerRewards || "0",
      },
      earlyUserRewards: {
        eligible: !!walletRewards && new BigNumber(walletRewards.earlyUserRewards).gt(0),
        amount: walletRewards?.earlyUserRewards || "0",
      },
      liquidityProviderRewards: {
        eligible: !!walletRewards && new BigNumber(walletRewards.liquidityProviderRewards).gt(0),
        amount: walletRewards?.liquidityProviderRewards || "0",
      },
      communityRewards: {
        eligible: communityRewards ? new BigNumber(communityRewards).gt(0) : false,
        amount: communityRewards || "0",
      },
    };
  }

  async processUploadedRewardsFiles({
    walletRewardsFile,
    communityRewardsFile,
  }: {
    walletRewardsFile?: Express.Multer.File;
    communityRewardsFile?: Express.Multer.File;
  }) {
    if (communityRewardsFile) {
      await this.processCommunityRewardsFile(communityRewardsFile);
    }

    if (walletRewardsFile) {
      await this.processWalletRewardsFile(walletRewardsFile);
    }

    const [communityRewardsCount, walletRewardsCount] = await Promise.all([
      this.communityRewardsRepository.count(),
      this.walletRewardsRepository.count(),
    ]);

    return {
      communityRewardsCount,
      walletRewardsCount,
    };
  }

  private async processWalletRewardsFile(walletRewardsFile: Express.Multer.File) {
    try {
      await this.walletRewardsRepository.update({ id: Not(IsNull()) }, { processed: false });
      const walletRewardsContent = await readFile(walletRewardsFile.path, { encoding: "utf8" });
      const walletRewards = JSON.parse(walletRewardsContent);

      for (const walletAddress of Object.keys(walletRewards)) {
        await this.insertWalletRewards({
          walletAddress: ethers.utils.getAddress(walletAddress),
          earlyUserRewards: walletRewards[walletAddress]["bridgoor"] || 0,
          liquidityProviderRewards: walletRewards[walletAddress]["lp"] || 0,
          welcomeTravellerRewards: walletRewards[walletAddress]["bridge-traveler"] || 0,
        });
      }
    } catch (error) {
      this.logger.error(error);
      await this.walletRewardsRepository.update({ id: Not(IsNull()) }, { processed: true });
      throw new ProcessWalletRewardsFileException();
    }
  }

  private async processCommunityRewardsFile(communityRewardsFile: Express.Multer.File) {
    try {
      await this.communityRewardsRepository.update({ id: Not(IsNull()) }, { processed: false });

      const communityRewardsContent = await readFile(communityRewardsFile.path, { encoding: "utf8" });
      const communityRewards = JSON.parse(communityRewardsContent);

      for (const communityReward of communityRewards) {
        if (communityReward["ID"] && communityReward["Total Tokens"]) {
          await this.insertCommunityRewards(communityReward["ID"], communityReward["Total Tokens"]);
        }
      }
      await this.communityRewardsRepository.delete({ processed: false });
    } catch (error) {
      this.logger.error(error);
      await this.communityRewardsRepository.update({ id: Not(IsNull()) }, { processed: true });
      throw new ProcessCommunityRewardsFileException();
    }
  }

  private async insertCommunityRewards(discordId: string, amount: number) {
    let communityRewards = await this.communityRewardsRepository.findOne({ where: { discordId } });

    if (!communityRewards) {
      communityRewards = this.communityRewardsRepository.create();
    }

    const wei = new BigNumber(10).pow(18);
    communityRewards.amount = new BigNumber(amount).multipliedBy(wei).toString();
    communityRewards.discordId = discordId;
    communityRewards.processed = true;

    await this.communityRewardsRepository.save(communityRewards);
  }

  private async insertWalletRewards({
    earlyUserRewards,
    liquidityProviderRewards,
    walletAddress,
    welcomeTravellerRewards,
  }: {
    walletAddress: string;
    earlyUserRewards: number;
    liquidityProviderRewards: number;
    welcomeTravellerRewards: number;
  }) {
    let walletRewards = await this.walletRewardsRepository.findOne({ where: { walletAddress } });

    if (!walletRewards) {
      walletRewards = this.walletRewardsRepository.create();
    }

    const wei = new BigNumber(10).pow(18);
    walletRewards.earlyUserRewards = new BigNumber(earlyUserRewards).multipliedBy(wei).toString();
    walletRewards.liquidityProviderRewards = new BigNumber(liquidityProviderRewards).multipliedBy(wei).toString();
    walletRewards.welcomeTravellerRewards = new BigNumber(welcomeTravellerRewards).multipliedBy(wei).toString();
    walletRewards.walletAddress = walletAddress;
    walletRewards.processed = true;

    await this.walletRewardsRepository.save(walletRewards);
  }

  private async getWalletRewards(walletAddress: string) {
    return this.walletRewardsRepository.findOne({ where: { walletAddress } });
  }

  private async getCommunityRewards(walletAddress: string): Promise<string | undefined> {
    const userWallet = await this.userWalletService.getUserWalletByAttributes({ walletAddress });

    if (!userWallet) {
      return undefined;
    }

    const user = await this.userService.getUserByAttributes({ id: userWallet.userId });
    const communityRewards = await this.communityRewardsRepository.findOne({ where: { discordId: user.discordId } });

    if (!communityRewards) {
      return undefined;
    }

    return communityRewards.amount;
  }
}
