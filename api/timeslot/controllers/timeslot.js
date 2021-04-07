"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  //TODO: Find Timeslots greater than today's date +48hrs

  async find(ctx) {
    let entities;
    const today = new Date();
    if (ctx.query._q) {
      entities = await strapi.services.timeslot.search(ctx.query);
    } else {
      entities = await strapi.services.timeslot.find(ctx.query);
    }

    return entities.map((entity) => {
      const timeslot = sanitizeEntity(entity, {
        model: strapi.models.timeslot,
      });
      if (new Date(timeslot.date) < today || timeslot.curriculum !== null) {
        delete timeslot.date;
      }
      return timeslot;
    });
  },
};
