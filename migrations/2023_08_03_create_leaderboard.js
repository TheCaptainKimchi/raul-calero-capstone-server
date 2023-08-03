/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("leaderboard", (table) => {
    table.increments("id").primary();
    table.string("matchId").notNullable();
    table.string("username").notNullable();
    table.string("tagline").notNullable();
    table.string("puuid").notNullable();
    table.string("kills").notNullable();
    table.string("deaths").notNullable();
    table.string("assists").notNullable();
    table.string("kda").notNullable();
    table.string("acs").notNullable();
    table.string("map").notNullable();
    table.string("agent").notNullable();
    table.string("mode").notNullable();
    table.string("matchOutcome").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Set 'id' column as primary key
    table.primary("id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("leaderboard");
};
