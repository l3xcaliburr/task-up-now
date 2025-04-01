const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const USER_ID_INDEX = process.env.USER_ID_INDEX;

const getSignedUrl = async (key, operation, fileType = null) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 3600, // URL expires in 1 hour
  };

  if (operation === "putObject" && fileType) {
    params.ContentType = fileType;
  }

  try {
    console.log(`Generating signed URL for ${operation} on key: ${key}`);
    console.log("Params:", JSON.stringify(params));
    const url = await s3.getSignedUrlPromise(operation, params);
    console.log("Generated URL successfully");
    return url;
  } catch (error) {
    console.error(`Error generating signed URL: ${error.message}`);
    throw error;
  }
};

// Helper to analyze image with Rekognition
const analyzeImage = async (key) => {
  try {
    const params = {
      Image: {
        S3Object: {
          Bucket: BUCKET_NAME,
          Name: key,
        },
      },
      MaxLabels: 10,
      MinConfidence: 70,
    };

    console.log("Analyzing image with Rekognition:", key);
    const data = await rekognition.detectLabels(params).promise();
    console.log(
      "Rekognition results:",
      JSON.stringify(data.Labels.map((label) => label.Name))
    );
    return data.Labels.map((label) => label.Name);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return [];
  }
};

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const { httpMethod, resource, pathParameters, body } = event;
    const path = resource;
    const userId = event.headers.Authorization || "demo-user"; // In a real app, extract from JWT

    // Create a new task
    if (httpMethod === "POST" && path === "/tasks") {
      const taskData = JSON.parse(body);
      const taskId = uuidv4();
      const timestamp = new Date().toISOString();

      let imageUrl = null;
      let imageLabels = [];

      // If there's an image, generate a presigned URL for upload
      if (taskData.hasImage) {
        const imageKey = `${userId}/${taskId}/${taskData.filename}`;
        const fileType = taskData.fileType || "application/octet-stream"; // Default if not provided
        imageUrl = await getSignedUrl(imageKey, "putObject", fileType);
      }

      const task = {
        taskId,
        userId,
        title: taskData.title,
        description: taskData.description || "",
        dueDate: taskData.dueDate || null,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
        imageKey: taskData.hasImage
          ? `${userId}/${taskId}/${taskData.filename}`
          : null,
        imageLabels,
      };

      await dynamoDB
        .put({
          TableName: TABLE_NAME,
          Item: task,
        })
        .promise();

      return {
        statusCode: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          ...task,
          imageUploadUrl: imageUrl,
        }),
      };
    }

    // Get all tasks for a user
    if (httpMethod === "GET" && path === "/tasks") {
      const params = {
        TableName: TABLE_NAME,
        IndexName: USER_ID_INDEX,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      };

      const result = await dynamoDB.query(params).promise();
      const tasks = await Promise.all(
        result.Items.map(async (task) => {
          if (task.imageKey) {
            task.imageUrl = await getSignedUrl(task.imageKey, "getObject");
          }
          return task;
        })
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(tasks),
      };
    }

    // Get a specific task
    if (httpMethod === "GET" && path === "/tasks/{taskId}") {
      const { taskId } = pathParameters;

      const result = await dynamoDB
        .get({
          TableName: TABLE_NAME,
          Key: {
            taskId,
            userId,
          },
        })
        .promise();

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ message: "Task not found" }),
        };
      }

      let task = result.Item;
      if (task.imageKey) {
        task.imageUrl = await getSignedUrl(task.imageKey, "getObject");
      }

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(task),
      };
    }

    // Update a task
    if (httpMethod === "PUT" && path === "/tasks/{taskId}") {
      const { taskId } = pathParameters;
      const taskData = JSON.parse(body);
      const timestamp = new Date().toISOString();

      // Check if task exists
      const existingTask = await dynamoDB
        .get({
          TableName: TABLE_NAME,
          Key: {
            taskId,
            userId,
          },
        })
        .promise();

      if (!existingTask.Item) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ message: "Task not found" }),
        };
      }

      // Process image if there's a new one
      let imageUrl = null;
      let imageLabels = existingTask.Item.imageLabels || [];
      let imageKey = existingTask.Item.imageKey;

      if (taskData.hasNewImage && taskData.filename) {
        // Delete old image if exists
        if (imageKey) {
          await s3
            .deleteObject({
              Bucket: BUCKET_NAME,
              Key: imageKey,
            })
            .promise();
        }

        imageKey = `${userId}/${taskId}/${taskData.filename}`;
        // Add this line to get the file type
        const fileType = taskData.fileType || "application/octet-stream";
        // Update this line to pass the fileType
        imageUrl = await getSignedUrl(imageKey, "putObject", fileType);
      } else if (imageKey) {
        imageUrl = await getSignedUrl(imageKey, "getObject");
      }

      // Update the task
      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          taskId,
          userId,
        },
        UpdateExpression:
          "set title = :title, description = :description, dueDate = :dueDate, #taskStatus = :status, updatedAt = :updatedAt, imageKey = :imageKey, imageLabels = :imageLabels",
        ExpressionAttributeNames: {
          "#taskStatus": "status",
        },
        ExpressionAttributeValues: {
          ":title": taskData.title,
          ":description": taskData.description || "",
          ":dueDate": taskData.dueDate || null,
          ":status": taskData.status || existingTask.Item.status,
          ":updatedAt": timestamp,
          ":imageKey": imageKey,
          ":imageLabels": imageLabels,
        },
        ReturnValues: "ALL_NEW",
      };

      const result = await dynamoDB.update(updateParams).promise();

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          ...result.Attributes,
          imageUploadUrl: imageUrl,
        }),
      };
    }

    // Delete a task
    if (httpMethod === "DELETE" && path === "/tasks/{taskId}") {
      const { taskId } = pathParameters;

      // Get the task to check for images to delete
      const existingTask = await dynamoDB
        .get({
          TableName: TABLE_NAME,
          Key: {
            taskId,
            userId,
          },
        })
        .promise();

      // Delete associated image if it exists
      if (existingTask.Item && existingTask.Item.imageKey) {
        await s3
          .deleteObject({
            Bucket: BUCKET_NAME,
            Key: existingTask.Item.imageKey,
          })
          .promise();
      }

      // Delete the task
      await dynamoDB
        .delete({
          TableName: TABLE_NAME,
          Key: {
            taskId,
            userId,
          },
        })
        .promise();

      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Handle POST-upload image processing
    if (httpMethod === "POST" && path === "/tasks/{taskId}/process-image") {
      const { taskId } = pathParameters;

      // Get the task
      const result = await dynamoDB
        .get({
          TableName: TABLE_NAME,
          Key: {
            taskId,
            userId,
          },
        })
        .promise();

      if (!result.Item || !result.Item.imageKey) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ message: "Task or image not found" }),
        };
      }

      // Analyze the image
      const imageLabels = await analyzeImage(result.Item.imageKey);

      // Update the task with image labels
      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          taskId,
          userId,
        },
        UpdateExpression: "set imageLabels = :imageLabels",
        ExpressionAttributeValues: {
          ":imageLabels": imageLabels,
        },
        ReturnValues: "ALL_NEW",
      };

      const updateResult = await dynamoDB.update(updateParams).promise();

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(updateResult.Attributes),
      };
    }

    // Default response for unsupported methods/paths
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Invalid request" }),
    };
  } catch (error) {
    console.error("Error processing request:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
