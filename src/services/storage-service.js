
import { db } from '../core/db.js';

export const StorageService = {
    /**
     * Add a new work to the database
     * @param {Object} work - The work object to add
     * @returns {Promise<number>} - The id of the added work
     */
    async addWork(work) {
        return await db.works.add(work);
    },

    /**
     * Get recent works from the database
     * @param {number} limit - Number of works to retrieve
     * @returns {Promise<Array>} - Array of works
     */
    async getRecentWorks(limit = 50) {
        return await db.works.orderBy('timestamp').reverse().limit(limit).toArray();
    },

    /**
     * Delete a work by id
     * @param {number} id - The id of the work to delete
     * @returns {Promise<void>}
     */
    async deleteWork(id) {
        return await db.works.delete(id);
    },

    /**
     * Get a work by its id
     * @param {number} id - The id of the work to retrieve
     * @returns {Promise<Object>} - The work object
     */
    async getWorkById(id) {
        return await db.works.get(id);
    },

    /**
    * Clear all works
    * @returns {Promise<void>}
    */
    async clearAllWorks() {
        return await db.works.clear();
    }
};
