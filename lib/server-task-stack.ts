import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

export class TaskUpNowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for tasks
    const tasksTable = new dynamodb.Table(this, "TasksTable", {
      partitionKey: { name: "taskId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - consider RETAIN for production
    });

    // Add secondary index for querying all tasks for a specific user
    tasksTable.addGlobalSecondaryIndex({
      indexName: "UserIdIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    const taskAttachmentsBucket = new s3.Bucket(this, "TaskAttachmentsBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      autoDeleteObjects: true, // Automatically delete objects when bucket is deleted
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(365), // Set expiration for objects after 1 year
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30), // Move to IA after 30 days
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90), // Move to Glacier after 90 days
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
          exposedHeaders: [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2",
            "Content-Type", // Ensure Content-Type is in the exposed headers
          ],
        },
      ],
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
    });

    // Create a role for Lambda with permissions to access DynamoDB and S3
    const taskLambdaRole = new iam.Role(this, "TaskLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Add policies to the role
    taskLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    taskLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ],
        resources: [tasksTable.tableArn, `${tasksTable.tableArn}/index/*`],
      })
    );
    taskLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        resources: [`${taskAttachmentsBucket.bucketArn}/*`],
      })
    );
    taskLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["rekognition:DetectLabels"],
        resources: ["*"],
      })
    );

    // Create Lambda function for task operations
    const taskFunction = new lambda.Function(this, "TaskFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"), // Will create this directory later
      role: taskLambdaRole,
      environment: {
        TABLE_NAME: tasksTable.tableName,
        BUCKET_NAME: taskAttachmentsBucket.bucketName,
        USER_ID_INDEX: "UserIdIndex",
      },
    });

    taskAttachmentsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        principals: [new iam.ArnPrincipal(taskLambdaRole.roleArn)],
        resources: [`${taskAttachmentsBucket.bucketArn}/*`],
      })
    );

    // Create API Gateway
    const api = new apigateway.RestApi(this, "TasksApi", {
      restApiName: "Tasks Service",
      description: "API for managing tasks",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create API resources and methods
    const tasks = api.root.addResource("tasks");
    tasks.addMethod("GET", new apigateway.LambdaIntegration(taskFunction)); // List tasks
    tasks.addMethod("POST", new apigateway.LambdaIntegration(taskFunction)); // Create task

    const task = tasks.addResource("{taskId}");
    task.addMethod("GET", new apigateway.LambdaIntegration(taskFunction)); // Get task
    task.addMethod("PUT", new apigateway.LambdaIntegration(taskFunction)); // Update task
    task.addMethod("DELETE", new apigateway.LambdaIntegration(taskFunction)); // Delete task

    const processImage = task.addResource("process-image");
    processImage.addMethod(
      "POST",
      new apigateway.LambdaIntegration(taskFunction)
    );

    // Output the API endpoint URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    });
  }
}
