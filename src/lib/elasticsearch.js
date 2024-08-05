const { Client } = require("@elastic/elasticsearch");
const config = require("../config");

const esClient = new Client({ node: config.elasticsearchNode });

const createIndexIfNotExists = async (indexName) => {
  try {
    const { body: exists } = await esClient.indices.exists({
      index: indexName,
    });
    if (!exists) {
      console.log(`Index "${indexName}" does not exist. Creating it...`);
      await esClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              location: {
                type: "geo_point",
              },
              name: {
                type: "text",
              },
              email: {
                type: "keyword",
              },
              bio: {
                type: "text",
              },
              role: {
                type: "keyword",
              },
              createdAt: {
                type: "date",
              },
              updatedAt: {
                type: "date",
              },
            },
          },
        },
      });
      console.log(`Index "${indexName}" created successfully.`);
    } else {
      console.log(`Index "${indexName}" already exists.`);
    }
  } catch (error) {
    console.error(`Error checking/creating index "${indexName}":`, error);
    throw new Error("Failed to ensure index exists");
  }
};

const addUserToIndex = async (user) => {
  try {
    console.log(`Adding user to index: ${user.id}`);
    await esClient.index({
      index: "users",
      id: user.id,
      body: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: {
          lat: user.latitude,
          lon: user.longitude,
        },
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    console.log(`User added to index: ${user.id}`);
  } catch (error) {
    console.error(`Error adding user ${user.id} to index:`, error);
    throw new Error("Failed to add user to index");
  }
};

const bulkAddUsersToIndex = async (users) => {
  try {
    console.log("Bulk adding users to index.");
    const body = users.flatMap((user) => [
      { index: { _index: "users", _id: user.id } },
      {
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: {
          lat: user.latitude,
          lon: user.longitude,
        },
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    ]);

    const bulkResponse = await esClient.bulk({ refresh: true, body });

    if (bulkResponse && bulkResponse.body) {
      if (bulkResponse.body.errors) {
        console.error(
          "Bulk indexing errors:",
          JSON.stringify(bulkResponse.body.items, null, 2)
        );
      } else {
        console.log("Bulk add completed without errors.");
      }
    } else {
      console.error("Unexpected bulk response structure:", bulkResponse);
    }
  } catch (error) {
    console.error("Error bulk adding users:", error);
    throw new Error("Failed to bulk add users");
  }
};

module.exports = {
  esClient,
  createIndexIfNotExists,
  addUserToIndex,
  bulkAddUsersToIndex,
};
