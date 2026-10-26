import { ProviderError } from './provider.interface';
import type {
  CreateImageTaskParams,
  CreateVideoTaskParams,
  TaskResult,
  VideoProvider,
} from './provider.interface';
import * as client from './dashscope/client';

const POLL_INTERVAL_MS = 10_000;
const DEFAULT_TIMEOUT_MS = 12 * 60_000; // video tasks can take a few minutes

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** DashScope implementation of the VideoProvider boundary. */
export class DashScopeProvider implements VideoProvider {
  createVideoTask(params: CreateVideoTaskParams): Promise<string> {
    return client.createVideoTask(params);
  }

  createImageTask(params: CreateImageTaskParams): Promise<string> {
    return client.createImageTask(params);
  }

  async getTask(taskId: string): Promise<TaskResult> {
    const raw = await client.getTask(taskId);
    switch (raw.status) {
      case 'SUCCEEDED':
        return { state: 'SUCCEEDED', videoUrl: raw.videoUrl, imageUrl: raw.imageUrl };
      case 'FAILED':
      case 'CANCELED':
        return {
          state: 'FAILED',
          errorCode: raw.code ?? 'TASK_FAILED',
          errorMessage: raw.message ?? `Task ${raw.status.toLowerCase()}`,
        };
      case 'RUNNING':
        return { state: 'RUNNING' };
      default:
        return { state: 'PENDING' };
    }
  }

  async waitForTask(taskId: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<TaskResult> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const result = await this.getTask(taskId);
      if (result.state === 'SUCCEEDED' || result.state === 'FAILED') return result;
      if (Date.now() > deadline) {
        throw new ProviderError(
          `DashScope task ${taskId} did not finish within ${Math.round(timeoutMs / 60000)} minutes`,
          'TASK_TIMEOUT',
        );
      }
      await sleep(POLL_INTERVAL_MS);
    }
  }
}
