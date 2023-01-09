import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bull";
import { ScraperQueue } from "../adapter/messaging";

@Injectable()
export class ScraperQueuesService {
  private logger = new Logger(ScraperQueuesService.name);
  private queuesMap: Record<ScraperQueue, Queue>;

  public constructor(
    @InjectQueue(ScraperQueue.BlocksEvents) private blocksEventsQueue: Queue,
    @InjectQueue(ScraperQueue.MerkleDistributorBlocksEvents) private merkleDistributorBlocksEventsQueue: Queue,
    @InjectQueue(ScraperQueue.FillEvents) private fillEventsQueue: Queue,
    @InjectQueue(ScraperQueue.SpeedUpEvents) private speedUpEventsQueue: Queue,
    @InjectQueue(ScraperQueue.BlockNumber) private blockNumberQueue: Queue,
    @InjectQueue(ScraperQueue.TokenDetails) private tokenDetailsQueue: Queue,
    @InjectQueue(ScraperQueue.DepositReferral) private depositReferralQueue: Queue,
    @InjectQueue(ScraperQueue.TokenPrice) private tokenPriceQueue: Queue,
    @InjectQueue(ScraperQueue.DepositFilledDate) private depositFilledDateQueue: Queue,
    @InjectQueue(ScraperQueue.DepositAcxPrice) private depositAcxPriceQueue: Queue,
    @InjectQueue(ScraperQueue.SuggestedFees) private suggestedFeesQueue: Queue,
  ) {
    this.queuesMap = {
      [ScraperQueue.BlocksEvents]: this.blocksEventsQueue,
      [ScraperQueue.MerkleDistributorBlocksEvents]: this.merkleDistributorBlocksEventsQueue,
      [ScraperQueue.FillEvents]: this.fillEventsQueue,
      [ScraperQueue.SpeedUpEvents]: this.speedUpEventsQueue,
      [ScraperQueue.BlockNumber]: this.blockNumberQueue,
      [ScraperQueue.TokenDetails]: this.tokenDetailsQueue,
      [ScraperQueue.DepositReferral]: this.depositReferralQueue,
      [ScraperQueue.TokenPrice]: this.tokenPriceQueue,
      [ScraperQueue.DepositFilledDate]: this.depositFilledDateQueue,
      [ScraperQueue.DepositAcxPrice]: this.depositAcxPriceQueue,
      [ScraperQueue.SuggestedFees]: this.suggestedFeesQueue,
    };
    this.initLogs();
  }

  public async publishMessage<T>(queue: ScraperQueue, message: T) {
    const q = this.queuesMap[queue];

    if (q) {
      await q.add(message);
    }
  }

  public async publishMessagesBulk<T>(queue: ScraperQueue, messages: T[]) {
    const q = this.queuesMap[queue];

    if (q) {
      await q.addBulk(messages.map((m) => ({ data: m })));
    }
  }

  private initLogs() {
    setInterval(() => {
      for (const queueName of Object.keys(this.queuesMap)) {
        const queue = this.queuesMap[queueName] as Queue;
        queue.getJobCounts().then((data) => this.logger.log(`${queueName} ${JSON.stringify(data)}`));
      }
    }, 1000 * 60);
  }

  public async retryFailedJobs(queue: ScraperQueue) {
    const q = this.queuesMap[queue];

    if (!q) return;

    try {
      const failedJobs = await q.getFailed();
      for (const failedJob of failedJobs) {
        await failedJob.retry();
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
