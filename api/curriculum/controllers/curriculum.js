"use strict";
const { sanitizeEntity } = require("strapi-utils");
const finder = require("strapi-utils/lib/finder");

module.exports = {

  /**
   * Returns one order, as long as it belongs to the user
   * @param {any} ctx
   */

  async create(ctx) {
    const { timeslot } = ctx.request.body;

    const { user } = ctx.state;

    const BASE_URL = ctx.request.headers.origin || "http://localhost:3000";

    //Create the order
    const newCurriculum = await strapi.services.curriculum.create({
      user: user.id,
      timeslot: timeslot.id,
    });

    return { id: newCurriculum.id };
  }
};
