/**
 * @swagger
 * /api/odds/event/{eventId}:
 *   get:
 *     summary: Obtener cuotas de un evento
 *     tags: [Odds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Cuotas del evento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Evento no encontrado
 */

/**
 * @swagger
 * /api/odds/events:
 *   post:
 *     summary: Obtener cuotas de múltiples eventos
 *     tags: [Odds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventIds
 *             properties:
 *               eventIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 50
 *     responses:
 *       200:
 *         description: Cuotas de los eventos
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/odds/history/{eventId}:
 *   get:
 *     summary: Obtener historial de cuotas de un evento
 *     tags: [Odds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: marketId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: selection
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de cuotas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

