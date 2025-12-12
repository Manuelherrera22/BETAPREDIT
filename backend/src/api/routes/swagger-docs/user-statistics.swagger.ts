/**
 * @swagger
 * /api/statistics:
 *   get:
 *     summary: Obtener estadísticas del usuario
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all_time]
 *           default: all_time
 *     responses:
 *       200:
 *         description: Estadísticas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBets:
 *                       type: integer
 *                     totalWins:
 *                       type: integer
 *                     totalLosses:
 *                       type: integer
 *                     totalStaked:
 *                       type: number
 *                     totalWon:
 *                       type: number
 *                     roi:
 *                       type: number
 *                     winRate:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/statistics/by-sport:
 *   get:
 *     summary: Obtener estadísticas por deporte
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all_time]
 *           default: month
 *     responses:
 *       200:
 *         description: Estadísticas agrupadas por deporte
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/statistics/by-platform:
 *   get:
 *     summary: Obtener estadísticas por plataforma
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all_time]
 *           default: month
 *     responses:
 *       200:
 *         description: Estadísticas agrupadas por plataforma
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */


