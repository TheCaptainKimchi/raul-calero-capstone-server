/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();
  await knex("users").insert([
    {
      id: 1,
      username: "raul",
      password: "1234",
      riotId: "xStarWise",
      tagline: "NA1",
      email: "raulcalero7@gmail.com",
      puuid:
        "wyBvNX_NM_Qu61JJ0anao91ipKnUSDi98LPUNNpfPtrVO1DI9S4OUvQBzpPPseZpy1VpsWvhCw_Wgw",
    },
    {
      id: 2,
      username: "test",
      password: "1234",
      riotId: "Aang",
      tagline: "muse",
      email: "test@gmail.com",
      puuid:
        "hsGXe6aNiaARussPRER1jIGiRCcNOMZbv9oZrHcVkDgX9HxuptRTnZw9EBweIPf1Dq8TxO79L8MNbg",
    },
    {
      id: 3,
      username: "tenz",
      password: "1234",
      riotId: "SEN TenZ",
      tagline: "0505",
      email: "tenz@gmail.com",
      puuid:
        "iYpayodg_d0UfOloI-V8poJC_jJ3jE-6qYmcJiA0wgr6QCYK5OLsFJc1q64UYnvzYqrG0th8iV0DyQ",
    },
  ]);
};
