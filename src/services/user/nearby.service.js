const { esClient } = require("../../lib/elasticsearch");

/**
 * Fetches a user by ID from Elasticsearch
 * @param {string} userId
 * @returns {object} user details
 * @throws {Error} Throws an error if the user is not found
 */
const getUserById = async (userId) => {
  try {
    console.log(`Fetching user details for ID: ${userId}`);
    const response = await esClient.get({
      index: "users",
      id: userId,
    });

    console.log("Elasticsearch response:", response);

    if (response && response.found) {
      console.log("User details found:", response._source);
      return response._source;
    } else {
      console.error(`User with ID ${userId} not found in Elasticsearch.`);
      throw new Error("User not found");
    }
  } catch (error) {
    console.error(`Error fetching user by ID ${userId}:`, error);
    throw new Error("Failed to fetch user details from Elasticsearch");
  }
};

/**
 * Constructs the Elasticsearch query for users by proximity
 * @param {object} location
 * @param {string} userId
 * @param {number} from
 * @param {number} size
 * @returns {object} Elasticsearch query body
 */
const constructProximityQuery = (location, userId, from, size) => {
  const { lat, lon } = location;
  return {
    from,
    size,
    query: {
      bool: {
        must_not: [
          {
            term: { id: userId },
          },
        ],
        filter: { 
          geo_distance: {
            distance: "1000km",
            location: { lat, lon },
          },
        },
      },
    },
    sort: [
      {
        _geo_distance: {
          location: { lat, lon },
          order: "asc",
          unit: "km",
        },
      },
    ],
  };
};

/**
 * Fetches users by proximity to the given user
 * @param {string} userId
 * @param {number} page
 * @param {number} size
 * @returns {object} users, total count, page, and size
 * @throws {Error} Throws an error if the query fails
 */
const getUsersByProximity = async (userId, page, size) => {
  const from = (page - 1) * size;

  const user = await getUserById(userId);
  if (!user || !user.location) {
    throw new Error("User location not found");
  }

  console.log(
    `Searching for users near user ID: ${userId}, latitude: ${user.location.lat}, longitude: ${user.location.lon}`
  );

  const query = constructProximityQuery(user.location, userId, from, size);

  try {
    const response = await esClient.search({
      index: "users",
      body: query,
    });

    console.log("Search response:", JSON.stringify(response, null, 2));

    if (response && response.hits && Array.isArray(response.hits.hits)) {
      const users = parseSearchResults(response.hits.hits, userId);
      console.log(
        `Found ${response.hits.total.value} users, returning page ${page} with size ${size}`
      );

      return {
        users,
        total: response.hits.total.value,
        page,
        size,
      };
    } else {
      console.error(
        "Unexpected search response structure:",
        JSON.stringify(response, null, 2)
      );
      throw new Error("Unexpected response structure from Elasticsearch");
    }
  } catch (error) {
    handleElasticsearchError(error);
  }
};

/**
 * Parses search results from Elasticsearch
 * @param {array} hits
 * @param {string} userId
 * @returns {array} parsed users excluding the querying user
 */
const parseSearchResults = (hits, userId) => {
  return hits
    .map((hit) => {
      const { role, createdAt, updatedAt, ...filteredUser } = hit._source;
      return {
        id: hit._id,
        ...filteredUser,
      };
    })
    .filter((user) => user.id !== userId); // Ensure the querying user is excluded
};

/**
 * Handles Elasticsearch errors
 * @param {object} error
 * @throws {Error} Rethrows error with details
 */
const handleElasticsearchError = (error) => {
  console.error("Error querying Elasticsearch:", error);
  if (error.meta && error.meta.body) {
    console.error(
      "Elasticsearch error details:",
      JSON.stringify(error.meta.body, null, 2)
    );
  }
  throw new Error("Failed to query Elasticsearch: " + error.message);
};

module.exports = {
  getUsersByProximity,
};