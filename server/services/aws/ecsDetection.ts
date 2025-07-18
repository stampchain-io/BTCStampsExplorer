// server/services/aws/ecsDetection.ts
import { logger } from "$lib/utils/logger.ts";
import process from "node:process";

export interface ECSMetadata {
  isECS: boolean;
  taskArn?: string;
  clusterName?: string;
  serviceName?: string;
  taskDefinitionFamily?: string;
  taskDefinitionRevision?: string;
  containerName?: string;
  logGroup?: string;
  logStream?: string;
  region?: string;
  availabilityZone?: string;
}

export class ECSDetectionService {
  private static instance: ECSDetectionService;
  private metadata: ECSMetadata | null = null;
  private readonly metadataURIV4 = process.env.ECS_CONTAINER_METADATA_URI_V4;
  private readonly metadataURIV3 = process.env.ECS_CONTAINER_METADATA_URI;

  private constructor() {}

  public static getInstance(): ECSDetectionService {
    if (!ECSDetectionService.instance) {
      ECSDetectionService.instance = new ECSDetectionService();
    }
    return ECSDetectionService.instance;
  }

  /**
   * Detect if running on ECS and gather metadata
   */
  public async detectECSEnvironment(): Promise<ECSMetadata> {
    if (this.metadata) {
      return this.metadata;
    }

    try {
      // Try ECS Metadata API V4 first (Fargate and EC2 with ECS agent 1.39.0+)
      if (this.metadataURIV4) {
        this.metadata = await this.fetchECSMetadataV4();
        logger.info("system", { message: "ECS environment detected via Metadata API V4", metadata: this.metadata });
        return this.metadata;
      }

      // Fall back to V3 (older ECS agent versions)
      if (this.metadataURIV3) {
        this.metadata = await this.fetchECSMetadataV3();
        logger.info("system", { message: "ECS environment detected via Metadata API V3", metadata: this.metadata });
        return this.metadata;
      }

      // Check for ECS environment variables as fallback
      if (this.hasECSEnvironmentVariables()) {
        this.metadata = this.buildMetadataFromEnvVars();
        logger.info("system", { message: "ECS environment detected via environment variables", metadata: this.metadata });
        return this.metadata;
      }

      // Not running on ECS
      this.metadata = { isECS: false };
      logger.info("system", { message: "Non-ECS environment detected" });
      return this.metadata;

    } catch (error) {
      logger.error("system", { message: "Error detecting ECS environment", error: String(error) });
      this.metadata = { isECS: false };
      return this.metadata;
    }
  }

  /**
   * Fetch ECS metadata using V4 API
   */
  private async fetchECSMetadataV4(): Promise<ECSMetadata> {
    try {
      const [taskResponse] = await Promise.all([
        fetch(`${this.metadataURIV4}/task`),
        fetch(`${this.metadataURIV4}/task/stats`).catch(() => null)
      ]);

      if (!taskResponse.ok) {
        throw new Error(`ECS Metadata API V4 failed: ${taskResponse.status}`);
      }

      const taskData = await taskResponse.json();
      const containerName = this.extractContainerName(taskData);
      const region = this.extractRegionFromArn(taskData.TaskARN);

      return {
        isECS: true,
        taskArn: taskData.TaskARN,
        clusterName: taskData.Cluster,
        serviceName: taskData.ServiceName,
        taskDefinitionFamily: taskData.Family,
        taskDefinitionRevision: taskData.Revision,
        ...(containerName && { containerName }),
        logGroup: taskData.LogGroupName,
        logStream: taskData.LogStreamName,
        ...(region && { region }),
        availabilityZone: taskData.AvailabilityZone,
      };
    } catch (error) {
      logger.error("system", { message: "Failed to fetch ECS metadata V4", error: String(error) });
      throw error;
    }
  }

  /**
   * Fetch ECS metadata using V3 API
   */
  private async fetchECSMetadataV3(): Promise<ECSMetadata> {
    try {
      const taskResponse = await fetch(`${this.metadataURIV3}/task`);

      if (!taskResponse.ok) {
        throw new Error(`ECS Metadata API V3 failed: ${taskResponse.status}`);
      }

      const taskData = await taskResponse.json();
      const containerName = this.extractContainerName(taskData);
      const region = this.extractRegionFromArn(taskData.TaskARN);

      return {
        isECS: true,
        taskArn: taskData.TaskARN,
        clusterName: taskData.Cluster,
        taskDefinitionFamily: taskData.Family,
        taskDefinitionRevision: taskData.Revision,
        ...(containerName && { containerName }),
        ...(region && { region }),
        availabilityZone: taskData.AvailabilityZone,
      };
    } catch (error) {
      logger.error("system", { message: "Failed to fetch ECS metadata V3", error: String(error) });
      throw error;
    }
  }

  /**
   * Check for ECS environment variables
   */
  private hasECSEnvironmentVariables(): boolean {
    return !!(
      process.env.ECS_CONTAINER_METADATA_URI_V4 ||
      process.env.ECS_CONTAINER_METADATA_URI ||
      process.env.AWS_EXECUTION_ENV?.startsWith('AWS_ECS_') ||
      process.env.AWS_BATCH_JOB_ID // Also covers AWS Batch which uses ECS
    );
  }

  /**
   * Build metadata from environment variables
   */
  private buildMetadataFromEnvVars(): ECSMetadata {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

    return {
      isECS: true,
      ...(region && { region }),
    };
  }

  /**
   * Extract container name from task data
   */
  private extractContainerName(taskData: any): string | undefined {
    if (taskData.Containers && Array.isArray(taskData.Containers)) {
      // Find the container that's not a sidecar
      const mainContainer = taskData.Containers.find((c: any) =>
        c.Type === 'NORMAL' || !c.Type
      );
      return mainContainer?.Name;
    }
    return undefined;
  }

  /**
   * Extract AWS region from ARN
   */
  private extractRegionFromArn(arn: string): string | undefined {
    if (!arn) return undefined;
    const parts = arn.split(':');
    return parts.length >= 4 ? parts[3] : undefined;
  }

  /**
   * Get current ECS metadata (cached)
   */
  public getMetadata(): ECSMetadata | null {
    return this.metadata;
  }

  /**
   * Check if running on ECS
   */
  public isRunningOnECS(): boolean {
    return this.metadata?.isECS ?? false;
  }

  /**
   * Get ECS service name for CloudWatch metrics
   */
  public getServiceName(): string {
    return this.metadata?.serviceName || 'btc-stamps-explorer';
  }

  /**
   * Get ECS cluster name for CloudWatch metrics
   */
  public getClusterName(): string {
    return this.metadata?.clusterName || 'unknown';
  }

  /**
   * Get AWS region for CloudWatch
   */
  public getRegion(): string {
    return this.metadata?.region || process.env.AWS_REGION || 'us-east-1';
  }
}

// Export singleton instance
export const ecsDetection = ECSDetectionService.getInstance();
